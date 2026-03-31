import threading
import time
import logging
import json
import traceback
import concurrent.futures
from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo
from typing import Dict, Any, List

from apps.core.database import (
    get_next_queued_job, update_job_status, get_job_items_by_status,
    update_item_status, update_job_progress, get_job,
    get_active_visibility_schedules, create_visibility_run, finish_visibility_run,
    set_visibility_schedule_runtime
)
from apps.web.blueprints.api_engine.seo_checklist_orchestrator import run_orchestrated_checklist
from apps.core.config import Config

_RUNNER_STARTED = False
_RUNNER_THREAD = None
_VISIBILITY_STARTED = False
_VISIBILITY_THREAD = None
_RUNNER_LOCK = threading.Lock()

class JobRunner:
    @staticmethod
    def start_worker():
        """Starts the background worker thread if not already running."""
        global _RUNNER_STARTED, _RUNNER_THREAD
        with _RUNNER_LOCK:
            if _RUNNER_STARTED:
                if _RUNNER_THREAD and _RUNNER_THREAD.is_alive():
                    logging.info("JobRunner already active.")
                    return

                restart_reason = "missing_thread_reference"
                if _RUNNER_THREAD and not _RUNNER_THREAD.is_alive():
                    restart_reason = "thread_not_alive"

                logging.warning(
                    f"JobRunner worker restarted; reason={restart_reason}"
                )

            thread = threading.Thread(target=JobRunner._worker_loop, daemon=True)
            thread.start()
            _RUNNER_THREAD = thread
            _RUNNER_STARTED = True
            logging.info("JobRunner started.")
            JobRunner.start_visibility_worker()

    @staticmethod
    def start_visibility_worker():
        global _VISIBILITY_STARTED, _VISIBILITY_THREAD
        with _RUNNER_LOCK:
            if _VISIBILITY_STARTED and _VISIBILITY_THREAD and _VISIBILITY_THREAD.is_alive():
                return

            visibility_thread = threading.Thread(target=JobRunner._visibility_loop, daemon=True)
            visibility_thread.start()
            _VISIBILITY_THREAD = visibility_thread
            _VISIBILITY_STARTED = True
            logging.info("Visibility scheduler worker started.")

    @staticmethod
    def runner_health():
        """Returns basic health info for the in-process runner."""
        thread_name = _RUNNER_THREAD.name if _RUNNER_THREAD else None
        return {
            "started": _RUNNER_STARTED,
            "thread_alive": bool(_RUNNER_THREAD and _RUNNER_THREAD.is_alive()),
            "thread_name": thread_name,
            "visibility_started": _VISIBILITY_STARTED,
            "visibility_thread_alive": bool(_VISIBILITY_THREAD and _VISIBILITY_THREAD.is_alive()),
        }

    @staticmethod
    def _visibility_loop():
        while True:
            try:
                schedules = get_active_visibility_schedules()
                for schedule in schedules:
                    JobRunner._run_visibility_schedule_if_due(schedule)
            except Exception as exc:
                logging.error(f"Error in visibility scheduler loop: {exc}")
            time.sleep(max(30, Config.JOBS_POLL_INTERVAL))

    @staticmethod
    def _run_visibility_schedule_if_due(schedule: Dict[str, Any]):
        client_id = schedule.get('client_id')
        if not client_id:
            return

        now_utc = datetime.now(timezone.utc)
        next_run_at_raw = schedule.get('next_run_at')
        parsed_next_run = None
        if next_run_at_raw:
            try:
                parsed_next_run = datetime.fromisoformat(str(next_run_at_raw).replace('Z', '+00:00'))
                if parsed_next_run.tzinfo is None:
                    parsed_next_run = parsed_next_run.replace(tzinfo=timezone.utc)
            except ValueError:
                parsed_next_run = None

        if parsed_next_run and parsed_next_run > now_utc:
            return

        run_id = create_visibility_run(client_id, triggered_by='scheduler')
        payload = schedule.get('run_payload') or {}
        try:
            result = run_orchestrated_checklist(
                url=payload.get('url', ''),
                kwPrincipal=payload.get('kwPrincipal', ''),
                pageType=payload.get('pageType', 'Otro'),
                geoTarget=payload.get('geoTarget', ''),
                cluster=payload.get('cluster', ''),
                gscQueries=payload.get('gscQueries', []),
                analyze_competitors=bool(payload.get('analyzeCompetitors', False)),
                competitor_urls=payload.get('competitorUrls', []),
                analysis_config=payload.get('analysisConfig', {}),
            )
            finish_visibility_run(run_id, 'completed', result=result)
            next_run_iso = JobRunner._calculate_next_run(schedule, now_utc).isoformat()
            set_visibility_schedule_runtime(client_id, now_utc.isoformat(), next_run_iso)
        except Exception as exc:
            error_text = str(exc)
            retryable = JobRunner._is_recoverable_visibility_error(error_text)
            finish_visibility_run(
                run_id,
                'retryable_error' if retryable else 'failed',
                error_message=error_text,
                retryable_error=retryable,
            )
            logging.warning(
                "Visibility run failed for client=%s retryable=%s error=%s",
                client_id,
                retryable,
                error_text,
            )

    @staticmethod
    def _calculate_next_run(schedule: Dict[str, Any], from_utc: datetime) -> datetime:
        tz_name = schedule.get('timezone') or 'UTC'
        run_hour = schedule.get('run_hour') or '09:00'
        frequency = (schedule.get('frequency') or 'daily').lower()
        try:
            tzinfo = ZoneInfo(tz_name)
        except Exception:
            tzinfo = timezone.utc

        local_now = from_utc.astimezone(tzinfo)
        hour, minute = 9, 0
        try:
            parts = run_hour.split(':')
            hour = max(0, min(23, int(parts[0])))
            minute = max(0, min(59, int(parts[1] if len(parts) > 1 else 0)))
        except Exception:
            pass

        candidate = local_now.replace(hour=hour, minute=minute, second=0, microsecond=0)
        step_days = 7 if frequency == 'weekly' else 1
        if candidate <= local_now:
            candidate = candidate + timedelta(days=step_days)
        return candidate.astimezone(timezone.utc)

    @staticmethod
    def _is_recoverable_visibility_error(error_text: str) -> bool:
        lowered = (error_text or '').lower()
        recoverable_tokens = ('rate limit', 'timeout', 'temporarily unavailable', 'unavailable', '503', '429')
        return any(token in lowered for token in recoverable_tokens)

    @staticmethod
    def _worker_loop():
        """Main loop for the worker."""
        logging.info("JobRunner loop initialized.")
        while True:
            try:
                job = get_next_queued_job()
                if job:
                    JobRunner.process_job(job)
                else:
                    time.sleep(Config.JOBS_POLL_INTERVAL)
            except Exception as e:
                logging.error(f"Error in JobRunner loop: {e}")
                time.sleep(Config.JOBS_POLL_INTERVAL)

    @staticmethod
    def process_job(job: Dict[str, Any]):
        """
        Processes a single job.
        """
        job_id = job['job_id']
        logging.info(f"Starting job {job_id}")

        try:
            update_job_status(job_id, 'running')
        except Exception as e:
            logging.error(f"Failed to set job {job_id} to running: {e}")
            return

        try:
            # Get items
            items = get_job_items_by_status(job_id, 'queued')
            if not items:
                update_job_status(job_id, 'completed')
                return

            # Configuration
            config = job.get('analysis_config', {}) or {}
            advanced_allowed = bool(job.get('advanced_allowed'))

            # If advanced is not allowed, ensure config reflects that
            if not advanced_allowed:
                 # Force standard mode
                 if config.get('mode') == 'advanced':
                     config['mode'] = 'standard'
                 if 'serp' in config:
                     config['serp']['confirmed'] = False

            # GSC Queries are expected to be in analysis_config under 'gscQueriesByUrl'
            gsc_queries_map = config.get('gscQueriesByUrl', {})

            cancel_flag = False

            # Use ThreadPoolExecutor for concurrent items
            max_workers = Config.JOBS_CONCURRENCY_LIMIT
            with concurrent.futures.ThreadPoolExecutor(max_workers=max_workers) as executor:
                pending_items = list(items)
                active_futures = []

                while pending_items or active_futures:
                    # Check job status periodically
                    current_job = get_job(job_id)
                    if not current_job:
                        logging.error(f"Job {job_id} disappeared!")
                        break

                    if current_job['status'] == 'cancelled':
                        logging.info(f"Job {job_id} cancelled.")
                        cancel_flag = True
                        break

                    if current_job['status'] == 'paused':
                        logging.info(f"Job {job_id} paused. Waiting...")
                        time.sleep(Config.JOBS_POLL_INTERVAL)
                        continue

                    # Submit new tasks if slots available
                    while len(active_futures) < max_workers and pending_items:
                        item = pending_items.pop(0)
                        future = executor.submit(JobRunner.process_single_item, item, config, gsc_queries_map, advanced_allowed)
                        active_futures.append(future)

                    # Wait briefly for completions
                    done, _ = concurrent.futures.wait(active_futures, timeout=1, return_when=concurrent.futures.FIRST_COMPLETED)

                    for future in done:
                        active_futures.remove(future)
                        try:
                            future.result()
                        except Exception as e:
                            logging.error(f"Error in item future: {e}")

                    if not pending_items and not active_futures:
                        break

                    # Sleep slightly to avoid busy loop if waiting
                    if not done:
                        time.sleep(0.5)

                if cancel_flag:
                    # Cancel remaining
                    for f in active_futures:
                        f.cancel()
                    # Mark pending as skipped
                    for item in pending_items:
                        update_item_status(item['item_id'], 'skipped')
                    return

            # Final status check
            final_job = get_job(job_id)
            if final_job['status'] not in ['cancelled', 'paused', 'failed']:
                 update_job_status(job_id, 'completed')
                 logging.info(f"Job {job_id} completed.")

        except Exception as e:
            logging.error(f"Job {job_id} failed with exception: {e}\n{traceback.format_exc()}")
            update_job_status(job_id, 'failed', last_error=str(e))

    @staticmethod
    def process_single_item(item, config, gsc_queries_map, advanced_allowed):
        item_id = item['item_id']
        url = item['url']
        page_id = item['page_id']
        resolved_page_id = page_id or item_id or url

        try:
            update_item_status(item_id, 'running')

            # Extract metadata
            meta = {}
            if item.get('item_metadata'):
                try:
                    meta = json.loads(item['item_metadata'])
                except (json.JSONDecodeError, TypeError):
                    pass

            kw = meta.get('kwPrincipal', '')
            p_type = meta.get('pageType', 'Otro')
            geo = meta.get('geoTarget', '')
            cluster = meta.get('cluster', '')
            analyze_competitors = bool(meta.get('analyzeCompetitors', False))
            competitor_urls = meta.get('competitorUrls', [])

            # Get GSC queries for this URL.
            # Precedence:
            # 1) Item-level metadata (new format): item_metadata.gscQueries
            # 2) Job-level map (legacy format): analysis_config.gscQueriesByUrl[url]
            gsc_queries = meta.get('gscQueries')
            if gsc_queries is None:
                gsc_queries = gsc_queries_map.get(url, [])

            result = run_orchestrated_checklist(
                url=url,
                kwPrincipal=kw,
                pageType=p_type,
                geoTarget=geo,
                cluster=cluster,
                gscQueries=gsc_queries,
                analyze_competitors=analyze_competitors,
                competitor_urls=competitor_urls,
                analysis_config=config
            )

            # Ensure frontend-compatible AnalysisResponse shape.
            if isinstance(result, dict) and 'pageId' in result and 'items' in result:
                wrapped_result = dict(result)
                wrapped_result['pageId'] = wrapped_result.get('pageId') or resolved_page_id
                wrapped_result.setdefault('url', url)
            else:
                wrapped_result = {
                    'pageId': resolved_page_id,
                    'items': result if isinstance(result, dict) else {},
                    'url': url,
                    'generatedAt': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()),
                }

                if isinstance(result, dict):
                    for key in ('advancedBlockedReason', 'advancedExecuted', 'engineMeta'):
                        if key in result:
                            wrapped_result[key] = result[key]

            update_item_status(item_id, 'done', result=wrapped_result)
            update_job_progress(item['job_id'], success_inc=1, processed_inc=1)

        except Exception as e:
            logging.error(f"Item {item_id} ({url}) failed: {e}")
            update_item_status(item_id, 'error', error=str(e))
            update_job_progress(item['job_id'], error_inc=1, processed_inc=1)
