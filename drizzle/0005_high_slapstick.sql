CREATE TABLE `quote_pdfs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`folio` varchar(30) NOT NULL,
	`lotNumber` varchar(50) NOT NULL,
	`vehicleName` varchar(255) NOT NULL,
	`vehicleVin` varchar(50),
	`platform` varchar(20),
	`stateCode` varchar(10),
	`clientName` varchar(255),
	`clientDpi` varchar(50),
	`clientPhone` varchar(50),
	`agreedPriceUSD` decimal(10,2),
	`agreedPriceGTQ` decimal(12,2),
	`totalCostUSD` decimal(10,2),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `quote_pdfs_id` PRIMARY KEY(`id`)
);
