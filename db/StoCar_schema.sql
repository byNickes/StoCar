DROP TABLE "auctions";
DROP TABLE "cars";

CREATE TABLE "cars" (
  "chassis_id" varchar,
  PRIMARY KEY ("chassis_id")
);

CREATE TABLE "auctions" (
  "owner_addr" varchar,
  "starting_price" int,
  "maximum_duration" int,
  "picture_id" int,
  "description" varchar,
  "chassis_id" varchar,
  FOREIGN KEY ("chassis_id") REFERENCES cars ("chassis_id"),
  PRIMARY KEY ("owner_addr")
);

INSERT INTO "auctions" ("owner_addr","starting_price","maximum_duration","picture_id","description","chassis_id")
VALUES ("0",0,0,0,"description1","chassis_id1");