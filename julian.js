function id(element) {
    return document.getElementById(element);
}

function noti_datetime(){

var noti_datetime = document.getElementById("noti_datetime").value;
var noti_datetimeDate= new Date(noti_datetime);

cordova.plugins.notification.local.schedule({
title: 'Notification at your time',
text: 'You put: '+noti_datetimeDate,
trigger: { at: noti_datetimeDate }
});
alert("The Notification is inserted");
}


var DateTime;
var db = null;

$(document).on('pageinit','#MainPage',function(){

     $('.home_btn').click(function(){
        $.mobile.navigate("#MainPage",{transition: "slide",direction: "reverse",info: "info goes here"});
    });
     $('#as1_btn').click(function(){
        $.mobile.navigate("#As1",{transition: "slide",info: "info goes here"});
        createDB();

    });
    $('#PickDate').click(function(){
       showDatePicker();
    });
    $('#PickTime').click(function(){
       showTimePicker();
    });
    $('#ListButton').click(function(){
        loadlist();


    });
     $('#deleteAllDb').click(function(){
        deleteDB();

    });
      $('#noti_btn_datetime').click(function(){
        noti_datetime();

    });

     

});

function loadlist(){

  if(($("#DatePrint").text() != "") && ($("#TimePrint").text() != "") ){
      if($("#Task_title").val() != ""){

        cordova.plugins.notification.local.schedule({
            title: $("#Task_title").val(),
            text: 'A partir de las '+DateTime.hour+":"+DateTime.minute,
            smallIcon: 'res://icon_notification.png',
           trigger: { at: new Date(moment(DateTime.year+DateTime.month+DateTime.day+"T"+DateTime.hour+DateTime.minute).format('MMMM DD ,YYYY kk:mm:ss '))}
        });
        insertDB();
      }
      else{
          window.alert("You need to set a Title for your recordatory");
      }
    }
    else{
        window.alert("You need to set a Date and a Time for your recordatory");
    }

};

function showDatePicker(){

    var options = {
    type: 'date',         // 'date' or 'time', required
    date: new Date(),     // date or timestamp, default: current date

};

window.DateTimePicker.pick(options, function (date) {
    $("#DatePrint").empty();
    $("#DatePrint").append(moment(date).format('MMMM Do YYYY'));
    DateTime = {year:moment(date).format('YYYY'),month:moment(date).format('MM'), day:moment(date).format('DD')};
});

}

function showTimePicker(){
    var options = {
    type: 'time',         // 'date' or 'time', required
    date: new Date(),     // date or timestamp, default: current date

};

window.DateTimePicker.pick(options, function (date) {
    $("#TimePrint").empty();
    $("#TimePrint").append(moment(date).format('h:mm a'));
    DateTime.hour = moment(date).format('HH');
    DateTime.minute = moment(date).format('mm');

});

}

function createDB(){

     db = window.sqlitePlugin.openDatabase({name: 'appointments.db', location: 'default'});

     db.sqlBatch([
    'CREATE TABLE IF NOT EXISTS appointments (id INTEGER PRIMARY KEY,description, date)',
     ], function() {
    console.log('Created database OK');
            selectDB();
  }, function(error) {
    console.log('SQL batch ERROR: ' + error.message);
  });

}

function insertDB(){
    var title = $("#Task_title").val();
    console.log(title);
    var dateString = DateTime.year+DateTime.month+DateTime.day+"T"+DateTime.hour+DateTime.minute;
    console.log(dateString);
    db.sqlBatch([
        'CREATE TABLE IF NOT EXISTS appointments (id INTEGER PRIMARY KEY,description, date)',
        ['INSERT INTO appointments VALUES (?,?,?)', [null,title, dateString ]],
    ], function() {
        console.log('Values inserted correctly');
            DateTime = {};
            selectDB();
            $("#Task_title").val("");
            $("#DatePrint").empty();
            $("#TimePrint").empty();
            $("#datepicker").panel("close")
  }, function(error) {
    console.log('SQL batch ERROR: ' + error.message);
  });


}

function selectDB(){

     db.executeSql('SELECT description, date , count(*) AS mycount FROM appointments', [], function(rs) {
    console.log('Record count (expected to be 3): ' + rs.rows.item(0).mycount);
       var counter = rs.rows.item(0).mycount;
         $("#ListHandler").empty();
        for(i = 1; i <= counter;i++){
           db.executeSql('SELECT id, description, date , count(*) AS mycount FROM appointments WHERE id='+i, [], function(res) {
                        console.log(res.rows.item(0).date);
                        $("#ListHandler").append(
                                                 '<li id="Elem'+res.rows.item(0).id+'" data-icon="delete" style="margin: 10px 10px 10px 10px; border:none;" class="ui-body-a">'+
                                                    '<div>'+
                                                        '<div class="ui-bar ui-bar-a" style="background-color:#D3D3D3; border:none;">'+
                                                            '<h3 style="float:left; text-align: left;">Event: '+res.rows.item(0).description+'</h3><h3 style="float:right; text-align:right;" ><a href="javascript:deleteElement('+res.rows.item(0).id+')"><i class="fa fa-times" style="color:red; font-size:18px;" aria-hidden="true"></i></a></h3>'+
                                                        '</div>'+
                                                        '<div class="ui-body ui-body-a">'+
                                                            '<h4>Date: '+moment(res.rows.item(0).date).format('MMMM Do YYYY, h:mm:ss a')+'</h4>'+
                                                        '</div>'+
                                                    '</div>'+
                                                '</li>');
                           },
                         function(error) {
                        console.log('SELECT SQL statement ERROR: ' + error.message);
                      });
        }
  }, function(error) {
    console.log('SELECT SQL statement ERROR: ' + error.message);
  });
}

function deleteElement(id){
    db.executeSql('DELETE FROM appointments WHERE id=?', [id], function(rs) {
    console.log('rowsDeleted: ' + rs.rowsAffected);
    var ElemToDelete = "Elem"+id;
        $('#'+ElemToDelete+'').remove();
  }, function(error) {
    console.log('Delete SQL statement ERROR: ' + error.message);
  });

}

function deleteDB(){
    db.executeSql('DELETE FROM appointments', [], function(rs) {
    console.log('rowsDeleted: ' + rs.rowsAffected);
    $("#ListHandler").empty();
  }, function(error) {
    console.log('Delete SQL statement ERROR: ' + error.message);
  });
}


