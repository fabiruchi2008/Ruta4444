ALTER TABLE `quotes` ADD `trackingCode` varchar(20);--> statement-breakpoint
ALTER TABLE `quotes` ADD `adminNotes` text;--> statement-breakpoint
ALTER TABLE `quotes` ADD CONSTRAINT `quotes_trackingCode_unique` UNIQUE(`trackingCode`);