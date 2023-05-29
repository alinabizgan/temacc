const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser');
const session = require('express-session');
const app = express();
const fs = require('fs');

require('dotenv').config();

const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
const region = process.env.S3_REGION;
const sessionToken = process.env.sessionToken;

var AWS = require("aws-sdk");
AWS.config.update({
	accessKeyId: accessKeyId,
	secretAccessKey: secretAccessKey,
	region: region,
	sessionToken: sessionToken
});

const port = 6789;
app.use(cookieParser());

// directorul 'views' va conține fișierele .ejs (html + js executat la server)
app.set('view engine', 'ejs');
// suport pentru layout-uri - implicit fișierul care reprezintă template-ul site-ului este views/layout.ejs
app.use(expressLayouts);
// directorul 'public' va conține toate resursele accesibile direct de către client (e.g., fișiere css, javascript, imagini)
app.use(express.static('public'))
// corpul mesajului poate fi interpretat ca json; datele de la formular se găsesc în format json în req.body
app.use(bodyParser.json());
// utilizarea unui algoritm de deep parsing care suportă obiecte în obiecte
app.use(bodyParser.urlencoded({ extended: true }));

// la accesarea din browser adresei http://localhost:6789/ se va returna textul 'Hello World'
// proprietățile obiectului Request - req - https://expressjs.com/en/api.html#req
// proprietățile obiectului Response - res - https://expressjs.com/en/api.html#res
//app.get('/', (req, res) => res.send('Hello World'));

const fileparser = require('./fileparser');

//CREAREA CONEXIUNII CU BAZA DE DATE
var mysql = require('mysql');
//const { response } = require('express');
var con = mysql.createConnection({
	// host: 'localhost',
	// user: 'alina',
	// password: 'Abracadabra99.',
	// insecureAuth:true,
	// database: 'tema',

	host: 'proiectdb.c6kieo5jbtrv.us-east-1.rds.amazonaws.com',
	port: '3306',
	user: 'admin',
	password: 'database',
	database: 'proiectdb',
});
// con.connect(function(err) {
// 	//if (err) throw err;
// 	if (err) {
// 		console.log('Error connecting to Database',err);
// 		return;
// 	}
// 	console.log('Database is connected successfully !');
//   });
//   module.exports = con;
con.connect(function (err) {

	if (!err) {
		console.log("Database is connected ... ");
	} else {
		console.log("Error connecting database ...    ", err);
	}
});


//DE FIECARE DATA CAND APP PRIMESTE UN REQUEST, SE APELEAZA ACESTE FUNCTII
//INSTANTIERE SESIUNE  
app.use(session({
	key: 'uname',
	secret: 'somerandonstuffs',
	resave: false,
	saveUninitialized: false,
	cookie: {
		expires: 600000

	}
}));

app.locals.username = function () {
	var session = this.session
	if (session.user) {
		return session.uname;
	}
	return "";
};

//INSTANTIERE COOKIES
app.use((req, res, next) => {
	if (req.cookies.uname && !req.session.user) {
		res.clearCookie('uname');
	}
	next();
});

var sess;

global.cookie_loggedin = false;

app.post('/subscribe-aws', (req, res) => {
	var email_address = req.body.email_address;

	// Create subscribe/ email parameters
	var params = {
		Protocol: 'EMAIL',
		TopicArn: 'arn:aws:sns:us-east-1:247274249760:AlinaTopic',
		Endpoint: email_address
	};

	var subscribePromise = new AWS.SNS({ apiVersion: '2010-03-31' }).subscribe(params).promise();

	subscribePromise.then(
		function (data) {
			console.log(" Subscription ARN is " + data.SubscriptionArn);

		}).catch(function (err) {
			console.error(err, err.stack);
		});
});

app.get('/upload', (req, res) => {
	cookie_loggedin_value = req.cookies.loggedin;

	res.render('upload', { cookie_loggedin: req.cookies });
});

app.post('/api/upload', async (req, res) => {
	await fileparser(req)
		.then(data => {
			res.status(200).json({
				message: "Success",
				data
			})
		})
		.catch(error => {
			console.log(error);
			res.status(400).json({
				message: "An error occurred.",
				error
			})
		})
});

// app.post('/upload-file', (req, res) => {
// 	filename = req.body.file

// let options = {
// 	maxFileSize: 100 * 1024 * 1024, //100 MBs converted to bytes,
// 	allowEmptyFiles: false
// }

// const WriteStream = formidable(options);

// 	WriteStream.on('finish', function () {
// 		const fileContent = fs.readFileSync(filename);

// 		var s3 = new AWS.S3({ apiVersion: '2006-03-01' });

// 		var params = {
// 			Key: fileName,
// 			Body: fileContent,
// 			Bucket: 'myawsbuket',
// 		}

// 		s3.upload(params, function (err, data) {
// 			if (err) {
// 				throw err;
// 			}
// 			console.log(`File upload successfully.${data.Location}`);
// 		})

// 	})

// });



app.get('/', (req, res) => {

	cookie_loggedin_value = req.cookies.loggedin;

	res.render('index', { cookie_loggedin: req.cookies });

});

app.get('/cumparaturi', (req, res) => {
	//sess=req.session.uname;
	//var sql='SELECT * FROM produse';
	//con.query(sql, function (err, data, fields) {
	//if (err) throw err;
	let cookie_message = "Not logged in!";

	if (req.cookies.loggedin == "true") {
		cookie_message = "Yup! You are logged in!";
	}

	console.log(cookie_message);


	fs.readFile("produse.json", (err, data) => {
		if (err) {
			console.log(err);
		}
		const listaProduse = JSON.parse(data);

		cookie_loggedin_value = req.cookies.loggedin;

		res.render('cumparaturi', { produse: listaProduse, cookie_loggedin: req.cookies });
	});
});
app.get('/autentificare', (req, res) => {
	sess = req.session.uname;
	if (sess) {
		res.render('autentificare', { mesaj: req.cookies.mesajEroare });
		return;
	}

	// con.query('SELECT numeutiliz, parola FROM utilizatori', function (err, db_utilizatori, fields) {
	// 	if (err) throw err;
	// console.log(db_utilizatori[1].numeutiliz);
	// console.log(db_utilizatori[1].parola);
	// });

	res.render('autentificare', { mesaj: req.cookies.mesajEroare });
});

app.post('/verificare-autentificare', (req, res) => {
	sess = req.session;
	var num = req.body;


	if (num.uname && num.psw) {
		con.query('SELECT * FROM utilizatori WHERE numeutiliz = ? AND parola = ?', [num.uname, num.psw], function (err, db_rezultat, fields) {
			if (db_rezultat.length > 0) {
				session.uname = num.uname;
				console.log("Autentificare cu succes pentru " + session.uname);
				res.cookie('utilizator', num.uname, { expires: new Date(Date.now() + 120000) });
				res.cookie("loggedin", "true", { expires: new Date(Date.now() + 120000) }); // LOGAREA TINE 120 SEC;
				res.redirect(302, 'http://localhost:6789/cumparaturi');
				res.end();
			} else {
				//res.send('Utilizator/Parola incorecta!');
				res.cookie("mesajEroare", "Date greșite! Introduceți datele din nou!", { expires: new Date(Date.now() + 1000) });
				res.redirect(302, '/autentificare');
				res.end();
			}
			res.end();
		});
	}
	//else if (num.uname == "admin" && num.psw == "admin"){
	//	session.uname = num.uname;
	//	res.cookie('utilizator',num.uname, {expires: new Date(Date.now()+1000)});		
	//	res.redirect(302,'http://localhost:6789/admin');		
	//	res.end(); 
	//}
	// else{
	// 	res.cookie("mesajEroare","Date greșite! Introduceți datele din nou!",{expires: new Date(Date.now()+1000)});
	// 	res.redirect(302,'/autentificare');	
	// 	res.end();
	// }

});

//DEFINESC  RUTA PENTRU RESURSA /DELOGARE
app.get('/delogare', (req, res) => {
	//res.cookie('utilizator','',{maxAge:0});
	//res.clearCookie('utilizator');
	res.cookie('utilizator', '', { expires: new Date(Date.now()) });
	res.cookie("loggedin", "false", { expires: new Date(Date.now()) });
	res.redirect(302, 'http://localhost:6789/cumparaturi');
});


app.get('/contact', (req, res) => {
	cookie_loggedin_value = req.cookies.loggedin;

	res.render('contact', { cookie_loggedin: req.cookies });
});




app.get('/creare-bd', (req, res) => {
	/*con.connect(function(err) {
		if (err) throw err;
		console.log("Connected!");
		con.query("CREATE DATABASE cumparaturi", function (err, result) {
		  if (err) th
		  ("Database created");
		}); */

	// if admin

	var sql = "CREATE TABLE produse (numeprodus VARCHAR(50))";
	con.query(sql, function (err, result) {
		if (err) throw err;
		console.log("Table created");

	});
	res.redirect(302, 'http://localhost:6789/');
});


var list = {};
app.get('/inserare-bd', (req, res) => {
	/* con.query("DELETE FROM produse", function (err, result, fields) {
	if (err) throw err;
	console.log(result); 
  });  */
	var sql = "INSERT INTO produse (numeprodus, cantitate, pret) VALUES?";
	var values = [
		['Norton', null, 53131.00],
		['Lambretta', null, 29500.00],
		['2020 kawasaki vulcan 900 custom ', null, 34174.00],
		['Ural', null, 70564.00],
		['Triumph Motorcycles Model H', null, 57000.00],
		['Royal Enfield Bullet', null, 14506.00],
		['Suzuki GS500 ', null, 9836.00],
		['Norton DOminator SS ', null, 122970.00],
	];
	con.query(sql, [values], function (err, result) {
		if (err) throw err;
		console.log("Produse adaugate in baza de date");
	});

	con.query("SELECT * FROM produse", function (err, result, fields) {
		if (err) throw err;
		console.log(result);


	});

	res.redirect(302, 'http://localhost:6789/');
});

global.cumparaturi_id = [];
var cumparaturi = [];
app.post('/adaugare-cos', (req, res) => {
	var cump_id = req.body.id;
	cumparaturi_id.push(cump_id);
	console.log("Au fost adaugate in cos produsele cu id-urile " + cumparaturi_id);
});
app.get('/vizualizare-cos', (req, res) => {

	fs.readFile("produse.json", (err, data) => {
		if (err) {
			console.log(err);
		}
		const listaProduse = JSON.parse(data);

		res.render('vizualizare-cos', { produse: cumparaturi_id, produse: listaProduse });
	});
});

function arrayRemove(arr, value) {
	//console.log("F REMOVE EXECUTED");
	return arr.filter(function (ele) {
		return ele != value;
	});
}

app.post('/sterge-cos', (req, res) => {
	//global.cumparaturi_id.pop();
	var id_sters = req.body.id;
	var temp = arrayRemove(cumparaturi_id, id_sters);
	cumparaturi_id = temp;

	fs.readFile("produse.json", (err, data) => {
		if (err) {
			console.log(err);
		}
		const listaProduse = JSON.parse(data);

		console.log("A fost sters produsul cu ID-ul: " + id_sters);
		res.render('vizualizare-cos', { produse: cumparaturi_id, produse: listaProduse });
	});
});

app.post('/plaseaza-comanda', (req, res) => {
	console.log("Comanda a fost plasata cu produsele: " + cumparaturi_id);
	cumparaturi_id = [];
	res.render('plasare-comanda', { produse: cumparaturi_id });
});




app.post('/utilizator-nou', (req, res) => {
	var utilizatornou = req.body.name;
	var parolanoua = req.body.parola;
	var adresa = req.body.adresa;
	var telefon = req.body.telefon;
	con.query("INSERT INTO utilizatori (numeutiliz, parola, adresa, telefon) VALUES ('" + utilizatornou.toString() + "', '" + parolanoua.toString() + "', '" + adresa.toString() + "','" + telefon.toString() + "')", function (err, result) {
		if (err) throw err;
		console.log(result);
	});

});

app.listen(port, () => console.log(`Serverul rulează la adresa http://localhost:`));



