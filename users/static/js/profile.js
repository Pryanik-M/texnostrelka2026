function openEmailModal(){
document.getElementById("emailModal").style.display="block";
}

function closeEmailModal(){
document.getElementById("emailModal").style.display="none";
}

window.onclick = function(event){
let modal = document.getElementById("emailModal");
if(event.target == modal){
modal.style.display="none";
}
}

window.onload = function(){
let errorMessage = document.querySelector(".error-email");
if(errorMessage){
openEmailModal();
}

}