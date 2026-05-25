CREATE TABLE `ocean_rates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`vehicleSize` varchar(50) NOT NULL,
	`rateUsd` int NOT NULL,
	`tier` int NOT NULL,
	`description` varchar(200),
	`maxLengthFt` decimal(5,1),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ocean_rates_id` PRIMARY KEY(`id`),
	CONSTRAINT `ocean_rates_vehicleSize_unique` UNIQUE(`vehicleSize`)
);
--> statement-breakpoint
CREATE TABLE `shipping_rates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`brand` enum('copart','iaai') NOT NULL,
	`city` varchar(100) NOT NULL,
	`stateCode` varchar(10) NOT NULL,
	`inlandRateUsd` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `shipping_rates_id` PRIMARY KEY(`id`)
);
