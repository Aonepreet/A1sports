var express = require("express");
var ap = express();
var mysql2 = require("mysql2");
var cloudinary = require("cloudinary").v2;
var fileuploader = require("express-fileupload");
ap.use(fileuploader());
ap.listen(2001, function () {
    console.log("Server started successfullyy");
})
ap.use(express.static("publicproject"));
ap.get("/", function (req, resp) {
    let path = __dirname + "/publicproject/index.html";
    resp.sendFile(path);
})
ap.get("/signup", function (req, resp) {
    resp.send("hi");
})

cloudinary.config({
    cloud_name: 'dbiizrrpj',
    api_key: '944526249867571',
    api_secret: 'B4dyuk4BO9jlaBSGi-AC7pBzOwk' // Click 'View API Keys' above to copy your API secret
});
/********************AIVEN CONNECTIVITY********************* */
let config = "mysql://avnadmin:AVNS_0M2MeABNPRzroSZPdiM@mysql-976ed45-aonepreetsidhu-912f.i.aivencloud.com:20999/projectdb";// it defines webserver ?database?userid?password
let mysqlServer = mysql2.createConnection(config);
mysqlServer.connect(function (err) {
    if (err == null)
        console.log("Connected to aiven database server successfully..");
    else
        console.log(err.message);
})

/************** SIGNUP : SENDING DATA TO DATABASE **************/
ap.get("/signupdone", function (req, resp) {
    mysqlServer.query("insert into users (emailid,pwd,utype,dos) values(?,?,?,?)", [req.query.txtEmail, req.query.txtPwd, req.query.utype, req.query.dos], function (err) {
        if (err == null) {
            console.log("RECORD SENT SUCCESSFULLY....");
            resp.send("RECORD SENT SUCCESSFULLY....");
        }

        else {
            resp.send(err.message);
            console.log(err.message)
        }
    })
})

/****************LOGIN : MATCHING DATA FROM DATABASE************ */

ap.get("/logindone", function (req, resp) {

    let emailid = req.query.txtemail;
    let pwd = req.query.txtpwd;
    mysqlServer.query("select * from users where emailid=? and pwd=?", [emailid, pwd], function (err, jsonArray) {
        //resp.send(jsonArray);
        if (err != null) {
            resp.send(err.message);
            console.log(err.message);
        }
        else if (jsonArray.length == 1) {
            let utype = jsonArray[0].utype;
            resp.send(utype);

        }
        else
            resp.send("User not found..Try Signin!");
    })
})
/***************************SAVING ORGANIZATION DATA**************** */
ap.use(express.urlencoded(true));
ap.post("/save", async function (req, resp) {
    console.log(req.body);
    //resp.send(req.body);
    let filename = "";
    if (req.files == null)//pic not uploaded
    {
        filename = "nopic.jpg";
    }
    else {
        filename = req.files.txtprooffile.name;
        let path = __dirname + "/publicproject/images/" + filename;
        console.log(path);
        req.files.txtprooffile.mv(path);//to movethe uploaded file at req path
        ///SAVING UR FILE/PIC ON CLOUDINARY SERVER : first add async keyword in fn
        await cloudinary.uploader.upload(path).then(function (result) {
            filename = result.url;//will give url of ur pic on cloudinaryy server
            console.log(filename);
        });
    }
    req.body.txtprooffile = filename; //new name-value pair added in body at runtime
    //save data acc to columns in seq in aiven vala database
    mysqlServer.query("insert into organizations values(?,?,?,?,?,?,?,?,?,?,?)", [req.body.txtmail, req.body.txtorg, req.body.txtcontact, req.body.txtaddress, req.body.txtcity, req.body.txtprooffile, req.body.txtproof, req.body.txtsports.toString(), req.body.txtprev, req.body.txtwebsite, req.body.txtinsta], function (err) {
        if (err == null)
        // resp.send("RECORD SENT SUCCESSFULLY....");
        {
            resp.send(`
                    <script>
                        alert("Organizer data posted successfully!");
                        window.location.href = "/dashOrganizer.html";
                    </script>
                `);
        }
        else {
            resp.send(`
                    <script>
                        alert("Error: ${err.message}");
                        window.history.back();
                    </script>
                `);
            console.log(err.message);
        }
    })

})
ap.get("/hlo", function (req, resp) {
    let pathnew = __dirname + "/publicproject/dashOrganizer.html";
    resp.sendFile(pathnew);

})

/**********************FOR UPDATING ORGANIZATION DATA************* */
/******************UPDATING RECORDS****************** */
ap.post("/updateOrg", async function (req, resp) {
    //console.log(req.body);
    //resp.send(req.body);
    let filename = "";
    if (req.files == null)//pic not uploaded
    {
        filename = "nopic.jpg";
    }
    else {
        filename = req.files.txtprooffile.name;
        let path = __dirname + "/publicproject/images/" + filename;
        console.log(path);
        req.files.txtprooffile.mv(path);//to movethe uploaded file at req path
        ///SAVING UR FILE/PIC ON CLOUDINARY SERVER : first add async keyword in fn
        await cloudinary.uploader.upload(path).then(function (result) {
            filename = result.url;//will give url of ur pic on cloudinaryy server
            console.log(filename);
        });
    }
    req.body.txtprooffile = filename; //new name-value pair added in body at runtime
    //save data acc to columns in seq in aiven vala database
    //mysqlServer.query("insert into userss values(?,?,?,?,?)",[req.body.txtmail,req.body.txtpwd,req.body.utype,req.body.dob,req.body.profilepic],function(err){
    mysqlServer.query("update organizations set organization=?,contact=?,address=?,city=?,ppic=?,proof=?,sports=?,prev=?,website=?,insta=?  where emailid=?", [req.body.txtorg, req.body.txtcontact, req.body.txtaddress, req.body.txtcity, req.body.txtprooffile, req.body.txtproof, req.body.txtsports.toString(), req.body.txtprev, req.body.txtwebsite, req.body.txtinsta, req.body.txtmail], function (err) {
        if (err == null)
        //resp.send("RECORD UPDATED SUCCESSFULLY....");
        {
            resp.send(`
                    <script>
                        alert("Organizer data updated successfully!");
                        window.location.href = "/dashOrganizer.html";
                    </script>
                `);
        }
        else {
            resp.send(`
                    <script>
                        alert("Error: ${err.message}");
                        window.history.back();
                    </script>
                `);
            console.log(err.message);
        }
    })
})

//***************FETCHING USER FROM ORGANIZATION DATABASE BY JUST ENTERING EID***** */
ap.get("/searchOrg", function (req, resp) {
    let emailid = req.query.txtmail;
    //alert(emailid);
    mysqlServer.query("select * from organizations where emailid=?", [emailid], function (err, jsonArray) {
        //possibility is either0 or 1 record
        if (err != null) { resp.send(err.message); }
        else
            resp.send(jsonArray);
    })
});

/**************SAVING TOURNAMENTS INFORMATION***************** */
/***************************SAVING ORGANIZATION DATA**************** */
ap.use(express.urlencoded(true));
ap.post("/savetournaments", async function (req, resp) {
    console.log(req.body);
    //resp.send(req.body);
    let filename = "";
    if (req.files == null)//pic not uploaded
    {
        filename = "nopic.jpg";
    }
    else {
        filename = req.files.txtposter.name;
        let path = __dirname + "/publicproject/images/" + filename;
        console.log(path);
        req.files.txtposter.mv(path);//to movethe uploaded file at req path
        ///SAVING UR FILE/PIC ON CLOUDINARY SERVER : first add async keyword in fn
        await cloudinary.uploader.upload(path).then(function (result) {
            filename = result.url;//will give url of ur pic on cloudinaryy server
            console.log(filename);
        });
    }
    req.body.txtposter = filename; //new name-value pair added in body at runtime
    //save data acc to columns in seq in aiven vala database
    mysqlServer.query("insert into tournaments values(?,?,?,?,?,?,?,?,?,?,?)", [null, req.body.txtmail, req.body.txtgame, req.body.txttitle, req.body.txtfees, req.body.txtdate, req.body.txtcity, req.body.txtlocation, req.body.txtprizes, req.body.txtposter, req.body.txtinfo], function (err) {
        if (err == null)
        //resp.send("RECORD SENT SUCCESSFULLY....");
        {
            resp.send(`
                    <script>
                        alert(" Tournament posted successfully!");
                        window.location.href = "/dashOrganizer.html";
                    </script>
                `);
        }
        else {
            resp.send(`
                    <script>
                        alert("Error: ${err.message}");
                        window.history.back();
                    </script>
                `);
            console.log(err.message);
        }
    })

})
/*************************SHOWING TOURNAMENTS IN CARDS**************************/
ap.get("/angular", function (req, resp) {
    //resp.send("<b><u>Its Home Page</b>");
    let path = __dirname + "/publicproject/angular.html";
    resp.sendFile(path);

})

ap.get("/fetch-all-tournaments", function (req, resp) {
    let c = req.query.city;
    let g = req.query.game;
    //console.log(g);
    //console.log(c);
    mysqlServer.query("select * from tournaments where city=? and game=?", [c, g], function (err, jsonArray) {

        if (err != null) {
            resp.send(err.message);
        }
        else

            resp.send(jsonArray);

    })

})

/**************************FILLING CITY OPTION VALA COMBO**************/
ap.get("/fetch-all-cities", function (req, resp) {

    mysqlServer.query("select distinct city from tournaments", function (err, jsonArrayC) {

        if (err != null) {
            resp.send(err.message);
        }
        else

            resp.send(jsonArrayC);

    })

})


/**************************FILLING GAME OPTION VALA COMBO************* */
ap.get("/fetch-all-games", function (req, resp) {

    mysqlServer.query("select distinct game from tournaments", function (err, jsonArrayG) {

        if (err != null) {
            resp.send(err.message);
        }
        else

            resp.send(jsonArrayG);

    })

})
////////////////////**********************SAVING PLAYERS DATA**************************** */
ap.use(express.urlencoded(true));
ap.post("/saveplr", async function (req, resp) {
    console.log(req.body);


    //req.body.txtprooffile=filename; //new name-value pair added in body at runtime
    //save data acc to columns in seq in aiven vala database
    mysqlServer.query("insert into players values(?,?,?,?,?,?,?,?,?,?)", [req.body.txtmail, req.body.txtname, req.body.txtgames, req.body.txtcontact, req.body.txtdate.slice(0, 11), req.body.txtgender, req.body.txtaddress, req.body.txtcity, req.body.txtproof, req.body.txtprev], function (err) {
        if (err == null)
            //resp.send("PLAYER RECORDED SUCCESSFULLY....");
            resp.send(`
                    <script>
                        alert("Player recorded successfully!");
                        window.location.href = "/dashPlayer.html";
                    </script>
                `);
        /*else
        {resp.send(err.message);
            console.log(err.message)
        }*/
        else {
            resp.send(`
                    <script>
                        alert("Error: ${err.message}");
                        window.history.back();
                    </script>
                `);
            console.log(err.message);
        }
    })

})
/******************UPDATING PlAyers RECORDS****************** */
ap.post("/updatePlr", async function (req, resp) {
    //console.log(req.body);
    //resp.send(req.body);

    //save data acc to columns in seq in aiven vala database
    //mysqlServer.query("insert into userss values(?,?,?,?,?)",[req.body.txtmail,req.body.txtpwd,req.body.utype,req.body.dob,req.body.profilepic],function(err){
    mysqlServer.query("update players set name=?,games=?,mobile=?,dob=?,gender=?,address=?,city=?,idproof=?,other_info=?  where emailid=?", [req.body.txtname, req.body.txtgames, req.body.txtcontact, req.body.txtdate.slice(0, 11), req.body.txtgender, req.body.txtaddress, req.body.txtcity, req.body.txtproof, req.body.txtprev, req.body.txtmail], function (err) {
        if (err == null)
        // resp.send("PLAYER DATA UPDATED SUCCESSFULLY....");
        {
            resp.send(`
                    <script>
                        alert("Player record updated successfully!");
                        window.location.href = "/dashPlayer.html";
                    </script>
                `);
        }
        else {
            // {resp.send(err.message);
            //     console.log(err.message)
            resp.send(`
                    <script>
                        alert("Error: ${err.message}");
                        window.history.back();
                    </script>
                `);
            console.log(err.message);
        }
    })
})
//////////////////*****************************UPDATING PASSWORD ON SETTINGS************* */
ap.get("/updtdone", function (req, resp) {

    let emailid = req.query.txtemail;
    let pwd = req.query.txtpwd;
    let newpwd = req.query.txtnewpwd;
    //mysqlServer.query("select * from users where emailid=? and pwd=?",[emailid,pwd],function(err,jsonArray){
    mysqlServer.query("update users set pwd=? where emailid=? and pwd=?", [newpwd, emailid, pwd], function (err, result) {
        //resp.send(jsonArray);
        if (err != null)
            resp.send(err.message);
        else if (result.affectedRows == 1)

            resp.send("Credentials Updated Successfullyy");
        else
            resp.send("Invalid Credentials");



    })
})
