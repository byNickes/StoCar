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


$(document).ready(function(){
    assegnaEventHandler();
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
});
