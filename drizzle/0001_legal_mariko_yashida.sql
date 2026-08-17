CREATE TABLE `agent_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`level` varchar(50) NOT NULL DEFAULT 'info',
	`message` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `agent_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `app_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`keyName` varchar(255) NOT NULL,
	`keyValue` text NOT NULL,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `app_settings_id` PRIMARY KEY(`id`),
	CONSTRAINT `app_settings_keyName_unique` UNIQUE(`keyName`)
);
--> statement-breakpoint
CREATE TABLE `published_posts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` text NOT NULL,
	`originalUrl` text NOT NULL,
	`sourceName` varchar(255) NOT NULL,
	`content` text NOT NULL,
	`conceptOfDay` text,
	`impactTip` text,
	`imageUrl` text,
	`linkedinUrn` varchar(255),
	`status` varchar(50) NOT NULL DEFAULT 'success',
	`errorDetails` text,
	`publishedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `published_posts_id` PRIMARY KEY(`id`),
	CONSTRAINT `published_posts_originalUrl_unique` UNIQUE(`originalUrl`)
);
--> statement-breakpoint
CREATE TABLE `rss_sources` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`url` text NOT NULL,
	`language` varchar(10) NOT NULL DEFAULT 'FR',
	`active` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `rss_sources_id` PRIMARY KEY(`id`)
);
