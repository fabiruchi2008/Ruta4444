CREATE TABLE `contacts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`phone` varchar(50) NOT NULL,
	`email` varchar(320),
	`message` text,
	`source` varchar(100) DEFAULT 'website',
	`status` enum('new','contacted','converted','closed') NOT NULL DEFAULT 'new',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `contacts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `featured_vehicles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`vehicleId` varchar(100) NOT NULL,
	`vehicleVin` varchar(50),
	`vehicleTitle` varchar(500),
	`vehicleYear` int,
	`vehicleMake` varchar(100),
	`vehicleModel` varchar(100),
	`vehicleImage` text,
	`platform` enum('copart','iaai') NOT NULL,
	`bidPrice` decimal(10,2),
	`isActive` boolean NOT NULL DEFAULT true,
	`sortOrder` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `featured_vehicles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `quotes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientName` varchar(255) NOT NULL,
	`clientPhone` varchar(50) NOT NULL,
	`clientEmail` varchar(320),
	`vehicleId` varchar(100),
	`vehicleVin` varchar(50),
	`vehicleLot` varchar(50),
	`vehicleTitle` varchar(500),
	`vehicleYear` int,
	`vehicleMake` varchar(100),
	`vehicleModel` varchar(100),
	`vehicleBodyType` varchar(100),
	`vehicleStateCode` varchar(10),
	`platform` enum('copart','iaai') NOT NULL,
	`auctionPrice` decimal(10,2) NOT NULL,
	`platformFees` decimal(10,2),
	`usaTransport` decimal(10,2),
	`maritimeShipping` decimal(10,2),
	`cifValue` decimal(10,2),
	`customsDuty` decimal(10,2),
	`vat` decimal(10,2),
	`customsAdminFee` decimal(10,2),
	`rutaCarsService` decimal(10,2),
	`totalUSD` decimal(10,2),
	`totalGTQ` decimal(12,2),
	`exchangeRate` decimal(8,4),
	`status` enum('pending','contacted','in_process','completed','cancelled') NOT NULL DEFAULT 'pending',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `quotes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`key` varchar(100) NOT NULL,
	`value` text NOT NULL,
	`description` text,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `settings_id` PRIMARY KEY(`id`),
	CONSTRAINT `settings_key_unique` UNIQUE(`key`)
);
