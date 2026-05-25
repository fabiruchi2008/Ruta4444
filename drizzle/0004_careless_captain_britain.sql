CREATE TABLE `gt_market_prices` (
	`id` int AUTO_INCREMENT NOT NULL,
	`make` varchar(100) NOT NULL,
	`model` varchar(100) NOT NULL,
	`year` int,
	`price_gtq` int NOT NULL,
	`source` varchar(100) DEFAULT 'facebook_marketplace',
	`sample_count` int DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `gt_market_prices_id` PRIMARY KEY(`id`)
);
