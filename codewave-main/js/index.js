// Sample data for Confidence Level chart (can be dynamic from backend)
const confidenceData = {
  labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  datasets: [{
    label: 'Confidence Level',
    data: [65, 70, 72, 75, 80, 85, 88],
    backgroundColor: 'rgba(58, 58, 235, 0.6)',
    borderColor: 'rgba(58, 58, 235, 1)',
    borderWidth: 1,
    borderRadius: 5,
  }]
};

const config = {
  type: 'bar',
  data: confidenceData,
  options: {
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        ticks: {
          stepSize: 10,
          callback: function(value) { return value + '%'; }
        },
        title: {
          display: true,
          text: 'Confidence %'
        }
      }
    },
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return context.parsed.y + '% confidence';
          }
        }
      }
    }
  }
};

const ctx = document.getElementById('confidenceChart').getContext('2d');
new Chart(ctx, config);

// Button click handlers (for demonstration)
document.getElementById('newInterviewBtn').onclick = () => {
  // Redirect to the New Mock Interview page
  window.location.href = 'mock_interview.html';  // Update with your actual page URL
};

document.getElementById('viewFeedbackBtn').onclick = () => {
  // Redirect to the Past Feedback page
  window.location.href = 'feedback.html';  // Update with your actual page URL
};

document.getElementById('customizeInterviewBtn').onclick = () => {
  // Redirect to the Customize Interview Settings page
  window.location.href = 'settings.html';  // Update with your actual page URL
};

