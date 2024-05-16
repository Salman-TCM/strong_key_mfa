$.post("/justReg").done(function(data){
    justReg=data["justReg"];
    if(justReg){
      alert("Successful Registration of New User");
    }
});


$.post("/justUserDeleted").done(function(data){
    justUserDeleted=data["justUserDeleted"];
    if(justUserDeleted){
      alert("User Successfully Deleted");
    }
});


$.post("/getFailedReg").done(function(data){
    console.log(data);
    failedReg=data["failed"];
    if(failedReg == true){
      document.getElementById("failed").style.display = "inline";
      document.getElementById("failedbreak").style.display = "inline";
    }
});


if(!(document.getElementById("passcontainer") === null)){
    document.body.style.backgroundImage = "linear-gradient(white,white),url(\"/background.jpg\")";
}


function makeItPassword(){
   document.getElementById("passcontainer")
      .innerHTML = "<input class=\"input-out\" id=\"password\" name=\"password\" type=\"password\"/>";
   document.getElementById("password").focus();
}



function submitForm(intent){
         if(intent=="registration"){
         $.post('/getChallenge', {
             'intent' : intent,
             'username': $('#regusername').val(),
             'displayname': $('#displayname').val(),
             'firstname': $('#firstname').val(),
             'lastname': $('#lastname').val()
         }).done(resp => {
          if(resp.Response == "sqlite-error"){
            console.log(resp.Response);
            location.reload();
          }else if(resp.Response == "skfs-error"){
            console.log(resp.Response);
          } else {
            document.getElementById("failed").style.display = "none";
            document.getElementById("failedbreak").style.display = "none";
            callFIDO2Token(intent,resp.Response);
          }

             }).fail((jqXHR, textStatus, errorThrown) => {
          alert(jqXHR, textStatus, errorThrown);
        });

       } else if(intent=="authentication")
        $.post('/getChallenge', {
          'intent' : intent,
            'username': $('#username').val()
        })
            .done((resp) => {
          if(!resp.Response.toString().toLowerCase().includes("error")){
            callFIDO2Token(intent,resp.Response);
          } else {
            alert("Username not registered");
          }

            })
            .fail((jqXHR, textStatus, errorThrown) => {
          alert(jqXHR, textStatus, errorThrown);
            });

       }

       function callFIDO2Token(intent,challenge) {
         let challengeBuffer = challengeToBuffer(challenge);
         let credentialsContainer = window.navigator;
         if(intent=="registration"){
             credentialsContainer.credentials.create({ publicKey: challengeBuffer.Response })
          .then(credResp => {
          let credResponse = responseToBase64(credResp);
          credResponse.intent = intent;
            $.post('/submitChallengeResponse',  credResponse)
                .done(regResponse => onResult(intent,regResponse))
                .fail((jqXHR, textStatus, errorThrown) => {
                    console.log(jqXHR, textStatus, errorThrown);
                });
              })
          .catch(error => {
              alert(error);
          });
           } else if (intent=="authentication"){
             credentialsContainer.credentials.get({ publicKey: challengeBuffer.Response })
          .then(credResp => {
              let credResponse = responseToBase64(credResp);
              credResponse.intent = intent;
              $.post('/submitChallengeResponse', credResponse)
            .done(authResponse => onResult(intent,authResponse))
            .fail((jqXHR, textStatus, errorThrown) => {
                alert(jqXHR, textStatus, errorThrown);
            });
          })
          .catch(error => {
              alert(error);
          });
         }
       }
         function onResult(intent,response){
           if(intent=="registration"){
             if(!response.Response.toString().toLowerCase().includes("error")){
        window.location.replace(window.location.protocol + "//" + window.location.host + "/login");
             } else {
        alert(response.Response);
             }
         } else if(intent=="authentication"){

          if(response.Response.toString().includes("Successfully processed sign response")){
             window.location.replace(window.location.protocol + "//" + window.location.host + "/dashboard");
           } else {
             alert(response.Response);
           }
         }
         }
