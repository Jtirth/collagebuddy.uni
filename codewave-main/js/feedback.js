// Using jsPDF for PDF generation
const { jsPDF } = window.jspdf;

document.getElementById('downloadPdfBtn').addEventListener('click', () => {
  const doc = new jsPDF();

  doc.setFontSize(20);
  doc.text('MockMate Interview Feedback', 14, 22);

  doc.setFontSize(14);
  doc.text('Score Breakdown:', 14, 35);

  // Scores to include
  const scores = [
    { label: 'Communication Clarity', value: 85 },
    { label: 'Confidence', value: 78 },
    { label: 'Content Quality', value: 90 },
    { label: 'Body Language', value: 70 }
  ];

  let y = 45;
  scores.forEach(score => {
    doc.text(`${score.label}: ${score.value}%`, 20, y);
    y += 10;
  });

  y += 10;
  doc.text('Personalized Tips:', 14, y);
  y += 8;

  const tips = [
    'Focus on structuring answers with the STAR method.',
    'Practice speaking more slowly and clearly.',
    'Work on maintaining confident body posture.',
    'Use specific examples to demonstrate skills.'
  ];

  tips.forEach(tip => {
    const splitText = doc.splitTextToSize(`• ${tip}`, 180);
    doc.text(splitText, 20, y);
    y += splitText.length * 7;
  });

  y += 10;
  doc.text('Transcript:', 14, y);
  y += 8;

  // You could add transcript here; for brevity, adding shortened sample
  const transcriptText = `
Tell me about yourself.
I am a software engineer with 3 years of experience.
My communication could be clearer when explaining complex topics.
The role interests me because it aligns well with my skills and career goals.
  `.trim();

  const splitTranscript = doc.splitTextToSize(transcriptText, 180);
  doc.text(splitTranscript, 20, y);

  // Save PDF
  doc.save('MockMate_Feedback_Report.pdf');
});

document.getElementById('shareMentorBtn').addEventListener('click', () => {
  // Simulate sharing. Replace with your backend call or email integration.
  alert('Feedback report sent to your mentor!');
});



    document.getElementById('generatePdfBtn').addEventListener('click', () => {
      const doc = new jsPDF();

      doc.setFontSize(18);
      doc.text('Interview Feedback Report', 14, 20);

      doc.setFontSize(12);
      doc.text('Candidate: John Doe', 14, 35);
      doc.text('Date: 2025-08-07', 14, 43);

      doc.setFontSize(14);
      doc.text('Score Breakdown:', 14, 60);

      const scores = [
        { label: 'Communication Clarity', value: '75%' },
        { label: 'Confidence', value: '68%' },
        { label: 'Content Quality', value: '80%' },
        { label: 'Body Language', value: '60%' },
      ];

      let y = 70;
      scores.forEach(score => {
        doc.text(`${score.label}: ${score.value}`, 20, y);
        y += 8;
      });

      y += 10;
      doc.text('Transcript Highlights & Suggestions:', 14, y);
      y += 8;

      const transcriptHighlights = [
        'Area to Improve: Needs to clearly articulate technical concepts.',
        'Suggestion: Practice structuring answers in the STAR format.',
        'Observation: Shows good enthusiasm but occasionally hesitates.',
        'Tip: Work on pacing and avoid filler words like “um” and “uh”.',
      ];

      transcriptHighlights.forEach(line => {
        const splitText = doc.splitTextToSize(line, 180);
        doc.text(splitText, 20, y);
        y += splitText.length * 7;
      });

      y += 5;
      doc.text('Personalized Tips:', 14, y);
      y += 8;

      const tips = [
        'Prepare answers for common behavioral questions.',
        'Practice speaking slowly and confidently.',
        'Use concrete examples to back up your skills.',
        'Maintain open body language and eye contact.'
      ];

      tips.forEach(tip => {
        const splitText = doc.splitTextToSize(`• ${tip}`, 180);
        doc.text(splitText, 20, y);
        y += splitText.length * 7;
      });

      y += 10;
      doc.text('Next Steps:', 14, y);
      y += 8;

      const nextSteps = [
        'Schedule more mock interviews focusing on technical questions.',
        'Review feedback after each session to track improvement.'
      ];

      nextSteps.forEach(step => {
        const splitText = doc.splitTextToSize(`- ${step}`, 180);
        doc.text(splitText, 20, y);
        y += splitText.length * 7;
      });

      doc.save('Basic_AI_Feedback_Report_JohnDoe.pdf');
    });