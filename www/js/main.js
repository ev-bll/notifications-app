function id(element) {
    return document.getElementById(element);
}

db = window.sqlitePlugin.openDatabase({name: 'demo.db', location: 'default'});

function init(){
    db.sqlBatch([
        'CREATE TABLE IF NOT EXISTS notifications (date, event)',
        [ 'INSERT INTO notifications VALUES (?,?)', ['12/12/2012', 'Dinner'] ],
        [ 'INSERT INTO notifications VALUES (?,?)', ['114/12/2012', 'Supper'] ],
    ], function() {
        console.log('Populated database OK');
    }, function(error) {
        console.log('SQL batch ERROR: ' + error.message);
    });    
}

function loadList(){
    db.sqlBatch([
        'SELECT * FROM notifications (date, event)',
    ], function() {
        console.log('Populated database OK');
    }, function(error) {
        console.log('SQL batch ERROR: ' + error.message);
    });
    
    var data = {"notifications":["08/12/2017 - 11:30","07/12/2017 - 12:30","22/12/2017 - 15:30"]}
    
    var myHtml ="";
    
    for (i=0;i<data.notifications.length;i++){
        myHtml += "<li>" + data.notifications[i] + "</li>";
    }
    
   id("myList").innerHTML = myHtml;
}

function addNotPage(){
    $.mobile.navigate("#addNotPage", {info:"Add a new notification"});
}

function addNot(){
    var inputDate = document.getElementById("input-date");
    var notifDate = new Date(inputDate);
    cordova.plugins.notification.local.schedule({
        title: 'Design team meeting',
        text: '3:00 - 4:00 PM',
        trigger: { at: notifDate }
    });
}

function deleteNot(){
    db.sqlBatch([
        'TRUNCATE TABLE notifications (date, event)',
    ], function() {
        console.log('Populated database OK');
    }, function(error) {
        console.log('SQL batch ERROR: ' + error.message);
    });
}