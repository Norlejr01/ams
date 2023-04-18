var express = require('express');
var path = require('path');
var logger = require('morgan');
var bodyParser = require('body-parser');
var neo4j = require('neo4j-driver');

var app = express();

//view engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false}));
app.use(express.static(path.join(__dirname, 'public')));

var driver = neo4j.driver('neo4j://localhost:7687', neo4j.auth.basic('neo4j','joel@123'));

var session = driver.session();

var multer = require('multer');

var storage =  multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './public/assets/images/avatarx/')
    },
    filename: (req, file, cb) =>{
        console.log(file);
        cb(null, Date.now() + path.extname(file.originalname))
    }
});

var upload = multer({storage: storage});


app.get('/admin', function(req, res){
    
    session
    .run('MATCH(n:Course) return n LIMIT 25')
    .then(function(result){
     var courseArr = [];
        result.records.forEach(function(record) {
         courseArr.push({
               id: record._fields[0].identity.low,
               name:  record._fields[0].properties.cname
           });
        });


       session
          .run('MATCH(n:Users WHERE n.user_type = "Admin") return n LIMIT 25')
          .then(function(result){
            var userArr = [];
            result.records.forEach(function(record) {
                userArr .push({
                   id: record._fields[0].identity.low,
                   fn:  record._fields[0].properties.fn,
                   uname:  record._fields[0].properties.uname,
                   utype:  record._fields[0].properties.user_type
               });
            });


            session
              .run('MATCH(n:Users WHERE n.user_type = "Alumnus/Alumna") return n LIMIT 25')
              .then(function(result){
                var userArr2 = [];
                result.records.forEach(function(record) {
                    userArr2.push({
                       id: record._fields[0].identity.low,
                       fn:  record._fields[0].properties.fn,
                       uname:  record._fields[0].properties.uname,
                       cgrad:  record._fields[0].properties.course,
                       ygrad:  record._fields[0].properties.year_graduated,
                       ipath:  record._fields[0].properties.img_path
                   });
                });

                res.render('admin',{
                    courses: courseArr,
                    users: userArr,
                    users2: userArr2,
                 });

              })
              .catch(function(err){
                   console.log(err);
              });

          })

          .catch(function(err){
            console.log(err);
          });
        
    })
    
    .catch(function(err){
     console.log(err);
    });

});



app.post('/addUser', upload.single('img_path') ,function(req, res){
    var fn = req.body.aname
    var gender = req.body.gender
    var course = req.body.course
    var year_graduated = req.body.year_graduated
    var uname = req.body.uname
    var upass = req.body.upass
    var current_job = req.body.current_job
    var user_type = req.body.user_type
    var img_path = req.file.filename // req.body.img_path

    session
       .run('create(n:Users{fn: $fn, gender: $gender, course: $course, year_graduated: $year_graduated, uname: $uname, upass: $upass, current_job: $current_job, user_type: $user_type, img_path: $img_path}) return n.fn', {fn: fn, gender: gender, course: course, year_graduated: year_graduated, uname: uname, upass: upass, current_job: current_job, user_type: user_type, img_path: img_path})
       .then(function(result){
            res.redirect('/admin');
       })
       .catch(function(err){
          console.log(err);
       });
});


app.post('/editCourse',function(req, res){
    var courseName = req.body.cname
    var courseID = req.body.cid
    session
       .run('MATCH (p:Course {cname: $courseID}) SET p.cname = $courseName RETURN p', {courseID: courseID, courseName: courseName})
       .then(function(result){
            res.redirect('/admin');
       })
       .catch(function(err){
          console.log(err);
       });
});



app.post('/deleteCourse',function(req, res){
    var courseID = req.body.cid
    session
       .run('MATCH (n:Course {cname: $courseID}) DETACH DELETE n', {courseID: courseID})
       .then(function(result){
            res.redirect('/admin');
       })
       .catch(function(err){
          console.log(err);
       });
});


app.post('/deleteUser',function(req, res){
    var fn = req.body.fn
    session
       .run('MATCH (n:Users {fn: $fn}) DETACH DELETE n', {fn: fn})
       .then(function(result){
            res.redirect('/admin');
       })
       .catch(function(err){
          console.log(err);
       });
});

app.post('/deleteAlumna',function(req, res){
    var fn = req.body.fn
    session
       .run('MATCH (n:Users {fn: $fn}) DETACH DELETE n', {fn: fn})
       .then(function(result){
            res.redirect('/admin');
       })
       .catch(function(err){
          console.log(err);
       });
});





app.post('/add',function(req, res){
    var courseName = req.body.cname
    session
       .run('create(n:Course{cname: $courseName}) return n.cname', {courseName: courseName})
       .then(function(result){
            res.redirect('/admin');
       })
       .catch(function(err){
          console.log(err);
       });
});

app.get('/orders/', function(req, res){
    res.render('orders',{})
});

app.get('/', function(req, res){
    session
       .run('MATCH(n:Course) return n LIMIT 25')
       .then(function(result){
        var courseArr = [];
           result.records.forEach(function(record) {

            console.log(record._fields[0].properties.cname);

            courseArr.push({
                  id: record._fields[0].identity.low,
                  name:  record._fields[0].properties.cname
              });
           });
           res.render('index',{
              courses: courseArr
           });
       })
       .catch(function(err){
        console.log(err);
       });
});

app.get('/my_network', function(req, res){
    res.render('my_network',{})
});

app.get('/job_opportunities', function(req, res){
    res.render('job_opportunities',{})
});

app.get('/forums', function(req, res){
    res.render('forums',{})
});


app.get('/about', function(req, res){
    res.render('about',{})
});



app.listen(4100);
console.log('Server started on port 4100');

module.exports = app;