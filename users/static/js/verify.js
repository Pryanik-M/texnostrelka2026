const inputs = document.querySelectorAll(".otp-input")
const codeField = document.getElementById("codeField")
const form = document.getElementById("verifyForm")
const errorBox = document.getElementById("errorBox")

inputs.forEach((input, index)=>{

input.addEventListener("input",()=>{

input.value = input.value.replace(/[^0-9]/g,'')

if(input.value && index < inputs.length-1){
inputs[index+1].focus()
}

checkCode()

})

input.addEventListener("keydown",(e)=>{

if(e.key === "Backspace" && !input.value && index>0){
inputs[index-1].focus()
}

})

})

function checkCode(){

let code=""

inputs.forEach(input=>{
code += input.value
})

if(code.length === 6){

codeField.value = code

form.submit()

}

}

document.addEventListener("paste",(e)=>{

let paste = e.clipboardData.getData("text").trim()

if(/^\d{6}$/.test(paste)){

inputs.forEach((input,i)=>{
input.value = paste[i]
})

checkCode()

}

})


const resendButton = document.getElementById("resendButton")
const timerText = document.getElementById("timerText")
const timerSpan = document.getElementById("timer")

let seconds = 60

function startTimer(){

const interval = setInterval(()=>{

seconds--

timerSpan.textContent = seconds

if(seconds <= 0){

clearInterval(interval)

resendButton.disabled = false
timerText.style.display = "none"

}

},1000)

}

startTimer()


// Добавьте проверку на существование элементов, чтобы не было ошибок в консоли
if (inputs.length > 0) {
    inputs.forEach((input, index) => {
        input.addEventListener("input", (e) => {
            // Разрешаем только цифры
            input.value = input.value.replace(/[^0-9]/g, '');

            if (input.value && index < inputs.length - 1) {
                inputs[index + 1].focus();
            }
            checkCode();
        });

        input.addEventListener("keydown", (e) => {
            if (e.key === "Backspace") {
                if (!input.value && index > 0) {
                    inputs[index - 1].focus();
                }
            }
        });
    });
}