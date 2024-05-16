/**
 * Copyright StrongAuth, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by the GNU Lesser General Public License v2.1
 * The license can be found at https://github.com/StrongKey/fido2/blob/master/LICENSE
 */

//Javascript pertaining to dashboard.html

//This function gets the username of the currently signed in user and displays it
$.post("/getUsername").done(function(data){
    console.log(data);
    document.getElementById("username").innerHTML = data["userData"]["username"];
});

//This function gets all quotes from the database the displays them in the list
$.post("/getAllQuotes").done(function(data){
    console.log(data);
    var quotes = data["quotes"];
    //reverses the quote data to display quotes by new to old
    quotes.reverse();
    for(i = 0; i < quotes.length;i++){
      var quoteId = quotes[i]["Qid"];
      if((i+1)%2){
        document.getElementById("quotelist").innerHTML += "<tr class='color-row'><th class='title-id'><span class='Qid'>"+ quotes[i]["Qid"]+"</span></th><th class='title-th'><span class='quote'>"+ quotes[i]["name"]+"</span></th><th><span class=\"filepathcon\"><span class='filepath'>"+ quotes[i]["filepath"]+"</span></span></th><th class='date-th'><span class='date'>"+quotes[i]["date"]+"</span></th><th><button class='deleteQuote' onclick='deleteQuote("+quoteId+")'>x</button></th></tr>";
      } else {
      document.getElementById("quotelist").innerHTML += "<tr><th class='title-id'><span class='Qid'>"+ quotes[i]["Qid"]+"</span></th><th class='title-th'><span class='quote'>"+ quotes[i]["name"]+"</span></th><th><span class=\"filepathcon\"><span class='filepath'>"+ quotes[i]["filepath"]+"</span></span></th><th class='date-th'><span class='date'>"+quotes[i]["date"]+"</span></th><th><button class='deleteQuote' onclick='deleteQuote("+quoteId+")'>x</button></th></tr>";
    }
  }
});


//This function deletes a specific quote based on id
var deleteQuote = function(quoteId){
  $.post("/deleteQuote", {id: quoteId});
  setTimeout(function() {
    location.reload();
    }, 100);
}


//shows the delete user option
var showDeleteUser = function(){
  document.getElementById("delete-user-con").style.display = "inline";
}

//hides the delete user option
var hideDeleteUser = function(){
  document.getElementById("delete-user-con").style.display = "none";
}
