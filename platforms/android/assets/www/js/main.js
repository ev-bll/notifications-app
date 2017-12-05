function id(element) {
    return document.getElementById(element);
}

function init(){
    
    id("gotoPage2Butt").addEventListener("click", function(){
       gotoPage2();
   });
    
    id("loadListButt").addEventListener("click", function(){
       loadList();
   });
    
}

function gotoPage2(){
    $.mobile.navigate("#page2", {info:"info goes here"});
}


function loadList(){
    var data = {"notifications":["08/12/2017 - 11:30","07/12/2017 - 12:30","22/12/2017 - 15:30"]}
    
    var myHtml ="";
    
    for (i=0;i<data.notifications.length;i++){
        myHtml += "<li>" + data.notifications[i] + "</li>";
    }
    
   id("myList").innerHTML = myHtml;
    
    
}