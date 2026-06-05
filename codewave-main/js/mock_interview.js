// Elements
const videoElement = document.getElementById('webcam');
const questionDisplay = document.getElementById('questionDisplay');
const textInput = document.getElementById('textInput');
const recordBtn = document.getElementById('recordBtn');
const recordingStatus = document.getElementById('recordingStatus');
const timerDisplay = document.getElementById('timer');
const repeatBtn = document.getElementById('repeatBtn');
const skipBtn = document.getElementById('skipBtn');
const endBtn = document.getElementById('endBtn');
const inputRadioButtons = document.querySelectorAll('input[name="inputMode"]');

let mediaRecorder;
let chunks = [];
let isRecording = false;
let seconds = 0;
let timerInterval;

const questions = [
  "Tell me about yourself",
  "What are your strengths?",
  "Why do you want this job?",
  "Describe a challenging situation and how you handled it",
  "Where do you see yourself in 5 years?",
];
let currentQuestionIndex = 0;

// Initialize webcam
async function setupWebcam() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
    videoElement.srcObject = stream;
  } catch (err) {
    console.error("Error accessing webcam:", err);
    alert("Could not access webcam. Please allow webcam permissions and refresh.");
  }
}

// Timer start/stop/reset
function startTimer() {
  seconds = 0;
  timerDisplay.textContent = '00:00';
  timerInterval = setInterval(() => {
    seconds++;
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    timerDisplay.textContent = `${mins}:${secs}`;
  }, 1000);
}

function stopTimer() {
  clearInterval(timerInterval);
}

function resetTimer() {
  stopTimer();
  seconds = 0;
  timerDisplay.textContent = '00:00';
}

// Handle recording
async function startRecording() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);
    
    mediaRecorder.onstart = () => {
      chunks = [];
      recordingStatus.classList.remove('hidden');
      recordBtn.textContent = "⏹️ Stop Recording";
      isRecording = true;
      startTimer();
    };

    mediaRecorder.ondataavailable = e => {
      chunks.push(e.data);
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'audio/webm' });
      recordingStatus.classList.add('hidden');
      recordBtn.textContent = "🎙️ Start Recording";
      isRecording = false;
      stopTimer();

      // You can do something with the audio blob here, e.g., upload for AI analysis
      console.log('Recording stopped. Audio Blob:', blob);

      // Example: play back the recording
      // const audioUrl = URL.createObjectURL(blob);
      // new Audio(audioUrl).play();
    };

    mediaRecorder.start();
  } catch (err) {
    console.error("Error accessing microphone:", err);
    alert("Could not access microphone. Please allow microphone permissions and refresh.");
  }
}

function stopRecording() {
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop();
  }
}

// Toggle input mode (show textarea or recording button)
inputRadioButtons.forEach(radio => {
  radio.addEventListener('change', () => {
    if (radio.value === 'text' && radio.checked) {
      textInput.classList.remove('hidden');
      recordBtn.classList.add('hidden');
      recordingStatus.classList.add('hidden');
      if (isRecording) stopRecording();
    } else if (radio.value === 'voice' && radio.checked) {
      textInput.classList.add('hidden');
      recordBtn.classList.remove('hidden');
      recordingStatus.classList.add('hidden');
      // No auto recording start; wait for user to click record button
    }
  });
});

// Record button click
recordBtn.addEventListener('click', () => {
  if (!isRecording) {
    startRecording();
  } else {
    stopRecording();
  }
});

// Repeat question button
repeatBtn.addEventListener('click', () => {
  alert("Repeating question: " + questions[currentQuestionIndex]);
  // Optionally, add Text-to-Speech to replay question audio
});

// Skip question button
skipBtn.addEventListener('click', () => {
  if (currentQuestionIndex < questions.length - 1) {
    currentQuestionIndex++;
    questionDisplay.textContent = questions[currentQuestionIndex];
    resetTimer();
    if (isRecording) stopRecording();
    recordingStatus.classList.add('hidden');
    recordBtn.textContent = '🎙️ Start Recording';
    isRecording = false;
    textInput.value = '';
  } else {
    alert("No more questions.");
  }
});

// End interview button
endBtn.addEventListener('click', () => {
  if (confirm('End the interview session?')) {
    // Redirect to summary or home page as needed
    window.location.href = 'index.html'; // Adjust this URL
  }
});

// Handle Enter key on text input to submit and move to next question
textInput.addEventListener('keydown', function(event) {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault(); // Prevent newline

    const answer = textInput.value.trim();
    if (answer.length === 0) {
      alert('Please type your answer before submitting.');
      return;
    }

    // Save or process the answer here, e.g., send to backend or store locally
    console.log(`Answer recorded for question "${questions[currentQuestionIndex]}":`, answer);

    // Move to next question or end if done
    if (currentQuestionIndex < questions.length - 1) {
      currentQuestionIndex++;
      questionDisplay.textContent = questions[currentQuestionIndex];
      resetTimer();
      textInput.value = '';
      if (isRecording) {
        stopRecording();
        recordingStatus.classList.add('hidden');
        recordBtn.textContent = '🎙️ Start Recording';
        isRecording = false;
      }
    } else {
      if (confirm('You have completed all questions. End the interview now?')) {
        window.location.href = 'index.html'; // Adjust this URL
      }
    }
  }
});

// Initialize on page load
window.onload = () => {
  setupWebcam();
  questionDisplay.textContent = questions[currentQuestionIndex];
  resetTimer();
};
