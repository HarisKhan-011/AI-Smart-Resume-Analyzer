import type { Types } from "mongoose"

export function toStringId(id: Types.ObjectId | string): string {
  return typeof id === "string" ? id : id.toString()
}
