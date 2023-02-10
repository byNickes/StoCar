function assegnaEventHandler(){
    var butt=document.getElementsByClassName("button");
    for (i=0; i<butt.length; i++){
        butt[i].addEventListener("mouseenter",cambiaColore);
        butt[i].addEventListener("mouseleave", ripristinaColore);
    }
    var butt1=document.getElementsByClassName("button1");
    for (i=0; i<butt1.length; i++){
        butt1[i].addEventListener("mouseenter",cambiaColore);
        butt1[i].addEventListener("mouseleave", ripristinaColore);
    }
    var butt2=document.getElementsByClassName("button2");
    for (i=0; i<butt2.length; i++){
        butt2[i].addEventListener("mouseenter",cambiaColore);
        butt2[i].addEventListener("mouseleave", ripristinaColore);
    }
}

function cambiaColore(e){
    if (e.target.style.background=="rgba(190, 82, 74, 0.795)" && e.target.style.color=="white"){ 
        e.target.style.background= "white";
        e.target.style.color="black";
    }
    else {
        e.target.style.background="rgba(190, 82, 74, 0.9)";
        e.target.style.color="white";
    } 
}

function ripristinaColore(e){
    e.target.style.background="rgba(190, 82, 74, 0.795)";
    e.target.style.color="white";
}

function validaForm(){
    if(document.registr.cognome.value=="" ||
        document.registr.nome.value=="" ){
        return false;
    }
    if (document.registr.psw.value!=document.registr.confpsw.value){
        alert("Le password non corrispondono. Riprova!");
        return false;
    }
    else return true;
}
$(document).ready(function(){
    $("#pt2").hide();
    $("#procediButton").click(function(){
        if(validaForm()){
            $("#pt1").hide();
            $("#pt2").show();
        }
        else alert("Inserire tutti i campi");
    }); 
    $("#button").click(function(){
        $("#list").slideToggle();
    });
    $(".button_form").on ({
        mouseenter: function(){
        $(this).animate({ opacity: '0.5'}); 
        },
        mouseleave: function(){
            $(this).animate({ opacity: '1'});
        }
    });
    $('#crea').on({
        mouseenter: function(){
            $("#s1").show();
        }
    });
    $('#partecipa').on({
        mouseenter: function(){
            $("#s2").show();
        }
    });


    $(".tableProva").on({
        mouseenter: function() {
            $(this).css({ "width":"900px", "height":"180px", "box-shadow":" 0px 0px 2px 1px white "});
        },
        mouseleave: function (){
            $(this).css({"width":"845px", "height":"100px", "box-shadow":"none"});
        }
    });
    $(".felicetriste").animate({width:'90px', height:'90px'});
    var i=2;
    $("#aggiungiDomanda").click(function(){
        $('#dom' + i).fadeIn();
        if(i>10){
            alert("Hai raggiunto il massimo delle domande");
        }
        i+=1;
    });
    $("#codiceId").change(function(){
            var codice=$("#codiceId").val();
            $("#zonaDinamica").load("popup.php?codices="+codice,
            function(responseTxt, statusTxt, xhr){
            if(statusTxt == "error") alert("Errore"+xhr.status+":"+xhr.statusText);
            });
    });
    $("#cerca").click(function(){
        $("#zonaDinamica2").load("Visualizza.php",
        function(responseTxt, statusTxt, xhr){
        if(statusTxt == "error") alert("Errore"+xhr.status+":"+xhr.statusText);
        });
    });
    $(".TipoButton").click(function(){
        $("#zonaDinamica3").load(this.innerHTML+".php",
        function(responseTxt, statusTxt, xhr){
        if(statusTxt == "error") alert("Errore"+xhr.status+":"+xhr.statusText);
        });
    });
});

function normal(x) {
    x.style.height = "100%";
    x.style.width = "100%";
}
  
function big(x) {
    x.style.height = "103%";
    x.style.width = "103%";
}
