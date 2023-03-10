/* for development
DROP TABLE "auctions";
DROP TABLE "cars";*/

CREATE TABLE "cars" (
  "chassis_id" varchar,
  PRIMARY KEY ("chassis_id")
);

CREATE TABLE "auctions" (
  "owner_addr" varchar,
  "chassis_id_hex" varchar,
  "chassis_id" varchar,
  "picture_id" varchar,
  "description" varchar,
  FOREIGN KEY ("chassis_id") REFERENCES cars ("chassis_id"),
  PRIMARY KEY ("owner_addr","chassis_id_hex")
);