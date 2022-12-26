CREATE TABLE "user" (
  "address" varchar,
  PRIMARY KEY ("address")
);

CREATE TABLE "auction" (
  "owner_addr" varchar,
  "starting_price" int,
  "maximum_duration" int,
  "picture_id" int,
  "description" varchar,
  "chassis_id" varchar,
  PRIMARY KEY ("owner_addr")
);

COMMENT ON COLUMN "user"."address" IS '(0,1)';

COMMENT ON COLUMN "auction"."owner_addr" IS '(1,1)';

ALTER TABLE "auction" ADD FOREIGN KEY ("owner_addr") REFERENCES "user" ("address");
