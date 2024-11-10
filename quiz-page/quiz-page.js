const urlApi = 'api...';

document.addEventListener('DOMContentLoaded', async () => {
    const rankingData = await obterRanking('http://localhost:8080/api/ranking');

    rankingData.sort((a, b) => b.acertos - a.acertos);

    popularRanking(rankingData);
});

function popularRanking(rankingData) {
    const rankingTableBody = document.getElementById('ranking-quiz');
    
    rankingTableBody.innerHTML = '';

    rankingData.forEach(item => {
        const row = document.createElement('tr');

        const nameCell = document.createElement('td');
        nameCell.textContent = item.nome;

        const scoreCell = document.createElement('td');
        scoreCell.textContent = item.acertos;

        row.appendChild(nameCell);
        row.appendChild(scoreCell);

        rankingTableBody.appendChild(row);
    });
}

document.addEventListener('DOMContentLoaded', initQuiz);
const startButton = document.getElementById('start-button');
const userNameInput = document.getElementById('user-name');
const startContainer = document.getElementById('start-container');
const quizContainer = document.getElementById('quiz-container');
const nextButton = document.getElementById('next-button');

let userName = "";

function initQuiz() {
    userName = "";

    userNameInput.addEventListener('input', () => {
        startButton.disabled = userNameInput.value.trim() === "";
    });

    startButton.addEventListener('click', async () => {
        userName = userNameInput.value.trim();
        if (userName) {
            startContainer.style.display = 'none';
            quizContainer.style.display = 'block';
            
            const quizzes = await obterQuiz('http://localhost:8080/api/quiz');
            console.log(quizzes)
            if (quizzes.length > 0) {
                startQuiz(quizzes);
            } else {
                alert('Nenhum quiz encontrado.');
            }
        }
    });
}

let currentQuestionIndex = 0; 
let correctAnswers = 0; 

function startQuiz(quizzes) {
    currentQuestionIndex = 0; 
    correctAnswers = 0; 
    displayQuestion(quizzes[currentQuestionIndex]);
    
    const nextButton = document.getElementById('next-button');
    nextButton.disabled = false;
    nextButton.onclick = () => {
        const selectedOption = document.querySelector('input[name="option"]:checked');
        if (selectedOption) {
           
            if (selectedOption.value === quizzes[currentQuestionIndex].acerto) {
                correctAnswers++;
            }

            currentQuestionIndex++; 

            if (currentQuestionIndex < quizzes.length) {
                displayQuestion(quizzes[currentQuestionIndex]);
            } else {
                endQuiz(correctAnswers, quizzes.length);
            }
            resetChecked();
        } else {
            alert('Por favor, selecione uma opção.');
        }
    };
}

function endQuiz(correctAnswers, totalQuestions) {
    
    enviarRanking('http://localhost:8080/api/ranking', userName, correctAnswers);

    quizContainer.style.display = 'none';

    const endContainer = document.getElementById('end-container');
    endContainer.style.display = 'block';

    const endMessage = document.getElementById('end-message');
    endMessage.textContent = `Parabéns! Você acertou ${correctAnswers} de ${totalQuestions} perguntas.`;

    const returnButton = document.getElementById('return-button');
    returnButton.addEventListener('click', () => {
        window.location.href = './quiz-page.html';
    });
}


function displayQuestion(question) {
    const questionElement = document.getElementById("question");
    if (questionElement) {
        questionElement.textContent = question.pergunta;
    }

    const options = question.respostas;

    const optionIds = [
        "option-a", 
        "option-b", 
        "option-c", 
        "option-d", 
        "option-e"
    ];

    optionIds.forEach((id, index) => {
        const optionLabel = document.querySelector(`label[for="${id}"]`); 
        if (optionLabel) { 
            const optionKey = Object.keys(options)[index];
            optionLabel.textContent = `${String.fromCharCode(65 + index)}) ${options[optionKey]}`;
            const inputElement = document.getElementById(id);
            inputElement.value = options[optionKey]; 
        }
    });
}

async function obterQuiz(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Erro na requisição: ' + response.statusText);
        }
        const data = await response.json();

        const quizzesArray = [];

        data.forEach(item => {


            const respostas = new Respostas(
                item.respostas.a,
                item.respostas.b,
                item.respostas.c,
                item.respostas.d,
                item.respostas.e
            );

            const quiz = new Quiz(item.pergunta, respostas, item.acerto);
            quizzesArray.push(quiz);
        });

        return quizzesArray;
    } catch (error) {
        console.error('Erro:', error);
        return [];
    }
}

async function obterRanking(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Erro na requisição: ' + response.statusText);
        }
        const data = await response.json(); 
        return data;
    } catch (error) {
        console.error('Erro:', error);
        return [];
    }
}

async function enviarRanking(url, nome, acertos) {
    const rankingData = {
        nome: nome,
        acertos: acertos
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(rankingData)
        });

        if (!response.ok) {
            const errorDetails = await response.text(); 
            throw new Error('Erro ao enviar dados: ' + response.statusText + ' - ' + errorDetails);
        }

        const data = await response.json();
        console.log('Resposta do servidor:', data);
    } catch (error) {
        console.error('Erro:', error);
    }
}


class Respostas {
    constructor(a, b, c, d, e) {
        this.a = a;
        this.b = b;
        this.c = c;
        this.d = d;
        this.e = e;
    }
}

class Quiz {
    constructor(pergunta, respostas, acerto) {
        this.pergunta = pergunta;
        this.respostas = respostas;
        this.acerto = acerto;
    }
}

function resetChecked() {
    const radios = document.getElementsByName("option");
    radios.forEach(radio => {
        radio.checked = false;
    });
}
