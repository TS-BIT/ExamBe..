import express from "express";
import mysql from "mysql";
import cors from 'cors';
import { body, check, validationResult  } from "express-validator";

const port = 3000;
const app = express();

const corsOptions = {
	origin: "http://localhost:4200",
};


const dbConfig = {
	host: "localhost",
	user: "root",
	password: "root",
	database: "book_store",
	multipleStatements: false,
};

const connection = mysql.createConnection({
	host: dbConfig.host,
	user: dbConfig.user,
	password: dbConfig.password,
	database: dbConfig.database,
});

connection.connect((error) => {
	if (error) throw error;
	console.log("Successfully connected to the database.");
});

app.use(cors(corsOptions));
app.use(express.json());


app.get("/test-conn", (req, res) => {
	connection.query("SELECT 1 + 1 AS solution", (err, rows, fields) => {
		if (err) throw err;
		console.log("The solution is: ", rows[0].solution);
		res.status(200).send({ solution: rows[0].solution });
	});
});

// get all records
app.get("/books", (req, res) => {
	connection.query("SELECT * FROM books", (err, rows, fields) => {
		if (err) {
            console.log(err.message);
            return res.status(500).send({
                error_code: err.code,
                error_message: err.sqlMessage,
            });
        };
        try {
            console.log('You got all', rows.length, 'records!');
        } catch (err) {
            console.log(err.message);
        };
        res.status(200).send(rows);
	});
});

// get record by id
app.get("/books/:id", (req, res) => {
	connection.query(
		"SELECT * FROM books WHERE id = ?",
		req.params.id,
		(err, rows, fields) => {
			if (err) {
                console.log(err.message);
                return res.status(500).send({
                    error_code: err.code,
                    error_message: err.sqlMessage,
                });
            };
            try {
                console.log('You got record with id: ', rows[0].id);
            } catch (err) {
                console.log(`Record with id ${req.params.id} not found!`);
            };
            if (rows.length === 0) {
                return res.status(404).send({
                    id: +req.params.id,
                    error_message: 'Record not found'
                });
            }
            res.status(200).send(rows);		
		}
	);
});

// create new record
app.post(
	"/books", 

	//validation:
	check("title").isLength({min: 1, max: 200}).withMessage("'title' field must be 1-200 characters long!"),
	check("price").isFloat({min: 0.01, max: 999.99}).withMessage("'price' field amout must be from 0.01 to 999.99 euros!"),
	check("discount_price").isFloat({min: 0.00, max: 999.99}).withMessage("'discount_price' field amout must be from 0.00 to 99.99 euros!"),
	check("sale").custom(value => (value == 1 || value == 0) ? true : false).withMessage("when there is sale, field value = 1, when there isn't sale, field value = 0!"),

	(req, res) => {
	
		const errors = validationResult(req);
        if (!errors.isEmpty()) {
            console.log(errors.errors[0].msg);
            return res.status(400).json(errors);
        }
		
		connection.query(
			"INSERT INTO books (`title`, `price`, `discount_price`, `sale`) VALUES (?, ?, ?, ?)",
			[
				req.body.title,
				req.body.price,
				req.body.discount_price,
				req.body.sale,
			],
			(err, rows, field) => {
				if (err) {
					console.log(err.message);
					return res.status(500).send({
						error_code: err.code,
						error_message: err.sqlMessage,
					});
				};
				console.log("created: ", { id: rows.insertId, ...req.body });
				res.status(201).send({ id: rows.insertId, ...req.body });	
			}
		);
	}
);

// update existing (previous) record by id
app.put(
	"/books/:id",
	
	//validation:
	check("title").isLength({min: 1, max: 200}).withMessage("'title' field must be 1-200 characters long!"),
	check("price").isFloat({min: 0.01, max: 999.99}).withMessage("'price' field amout must be from 0.01 to 999.99 euros!"),
	check("discount_price").isFloat({min: 0.00, max: 999.99}).withMessage("'discount_price' field amout must be from 0.00 to 99.99 euros!"),
	check("sale").custom(value => (value == 1 || value == 0) ? true : false).withMessage("when there is sale, field value = 1, when there isn't sale, field value = 0!"),
		
	(req, res) => {

		const errors = validationResult(req);
        	if (!errors.isEmpty()) {
            	console.log(errors.errors[0].msg);
            	return res.status(400).json(errors);
        	}
		
		connection.query(
			"UPDATE books SET title = ?, price = ?, discount_price = ?, sale = ? WHERE id = ?",
		[
				req.body.title,
				req.body.price,
				req.body.discount_price,
				req.body.sale,
				req.params.id,							
		],
		(err, rows, field) => {
			if (err) {
				console.log(err.message);
				return res.status(500).send({
					error_code: err.code,
					error_message: err.sqlMessage,
				});
			};
			console.log("Updated rows:", rows === undefined ? 0 : rows.affectedRows);
                if (!rows.affectedRows) {
                    console.log(`Record with id ${req.params.id} not found!`);
                    return res.status(404).send({
                        id: +req.params.id,
                        error_message: 'Record not found'
                    });
                }
                res.status(201).send({id: +req.params.id, ...req.body});	
			}
		);
	}
);

// delete record by id
app.delete("/books/:id", (req, res) => {
	console.log(req.params.id);
	connection.query(
		"DELETE FROM books WHERE id=?",
		req.params.id,
		(err, rows, field) => {
			if (err) {
                console.log(err.message);
                return res.status(500).send({
                    error_code: err.code,
                    error_message: err.sqlMessage,
                });
            };
            console.log("Deleted rows:", rows.affectedRows);
            if (!rows.affectedRows) return res.status(404).send({
                id: +req.params.id,
                error_message: 'Record not found'
            });
            res.status(204).send({
                id: +req.params.id,
                message: `Record with id ${req.params.id} deleted`
            });					
		}
	);
});

// total books:
app.get("/total", (req, res) => {
    connection.query("SELECT count(*) as total_books FROM books", (err, rows, fields) => {
        if (err) {
            console.log(err.message);
            return res.status(500).send({
                error_code: err.code,
                error_message: err.sqlMessage,
            });
        };
        console.log("Total books: ", rows[0].total_books);
        res.status(200).send({ total_books: rows[0].total_books });
    });
});

// average price:
app.get("/average_price", (req, res) => {
    connection.query("SELECT avg(price) as average_price FROM books", (err, rows, fields) => {
        if (err) {
            console.log(err.message);
            return res.status(500).send({
                error_code: err.code,
                error_message: err.sqlMessage,
            });
        };
        console.log("Average price: ", rows[0].average_price);
        res.status(200).send({ average_price: rows[0].average_price });
    });
});


app.listen(port, () =>
	console.log(`App listening on port ${port}!`)
);