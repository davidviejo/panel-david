export type Uuid = string;
export type IsoTimestamp = string;

export interface BaseEntity {
  id: Uuid;
  createdAt: IsoTimestamp;
  updatedAt: IsoTimestamp;
}
