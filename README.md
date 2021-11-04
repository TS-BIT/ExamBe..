# ExamBe

SQL script to boot the DB: 
```
CREATE DATABASE book_store;
USE book_store;
CREATE TABLE books(
	id INT(11) AUTO_INCREMENT PRIMARY KEY, NOT NULL, UNIQUE,
	title VARCHAR(200) NOT NULL,
	price DECIMAL(5,2) NOT NULL,
    discount_price DECIMAL(5,2) NOT NULL,
	sale TINYINT(1) NOT NULL
);

SELECT * FROM books;
```
```
Database (MySQL) dump file: "book_store_books.sql"
```