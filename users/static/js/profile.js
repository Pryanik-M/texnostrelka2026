function openEmailModal() {
    document.getElementById("emailModal").style.display = "block";
}

function closeEmailModal() {
    document.getElementById("emailModal").style.display = "none";
}

window.onclick = function(event) {
    let modal = document.getElementById("emailModal");
    if (event.target == modal) {
        modal.style.display = "none";
    }
}

window.onload = function() {
    let errorMessage = document.querySelector(".error-email");
    if (errorMessage) {
        openEmailModal();
    }

    // Меняем текст кнопки webpush на русский
    changeWebpushButtonText();
}

// Функция для изменения текста кнопки webpush
function changeWebpushButtonText() {
    // Ждем немного, чтобы кнопка успела загрузиться
    setTimeout(function() {
        const webpushContainer = document.getElementById('webpush-container');
        if (webpushContainer) {
            const buttons = webpushContainer.getElementsByTagName('button');
            const inputs = webpushContainer.getElementsByTagName('input');

            // Меняем текст для кнопок
            for (let btn of buttons) {
                if (btn.textContent.includes('Subscribe') || btn.textContent.includes('Unsubscribe')) {
                    if (btn.textContent.includes('Unsubscribe')) {
                        btn.textContent = 'Отписаться от уведомлений';
                    } else {
                        btn.textContent = 'Подписаться на уведомления';
                    }
                }
            }

            // Меняем текст для input (если используется input)
            for (let inp of inputs) {
                if (inp.type === 'submit' || inp.type === 'button') {
                    if (inp.value.includes('Subscribe') || inp.value.includes('Unsubscribe')) {
                        if (inp.value.includes('Unsubscribe')) {
                            inp.value = 'Отписаться от уведомлений';
                        } else {
                            inp.value = 'Подписаться на уведомления';
                        }
                    }
                }
            }
        }
    }, 500); // Задержка 500мс для загрузки
}

// Также добавляем MutationObserver для отслеживания изменений в DOM
const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
        if (mutation.type === 'childList') {
            changeWebpushButtonText();
        }
    });
});

// Запускаем observer после загрузки страницы
window.addEventListener('load', function() {
    const webpushContainer = document.getElementById('webpush-container');
    if (webpushContainer) {
        observer.observe(webpushContainer, { childList: true, subtree: true });
    }
});