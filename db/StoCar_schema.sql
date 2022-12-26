CREATE TABLE "auctions" (
  "owner_addr" varchar,
  "starting_price" int,
  "maximum_duration" int,
  "picture_id" int,
  "description" varchar,
  "chassis_id" varchar,
  PRIMARY KEY ("owner_addr")
);

COMMENT ON COLUMN "auction"."owner_addr" IS '(1,1)';
