// PDF Generator for Todo List

// Generate and download PDF of todo list
async function downloadTodoAsPDF() {
    try {
        // Check if jsPDF is loaded
        if (typeof jspdf === 'undefined') {
            alert('PDF library not loaded. Please refresh the page.');
            return;
        }

        const { jsPDF } = jspdf;
        const doc = new jsPDF();

        // Get all tasks from Firestore
        const tasks = await loadAllTasksForPDF();

        if (tasks.length === 0) {
            alert('No tasks to export!');
            return;
        }

        // PDF Configuration
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 20;
        let yPosition = margin;

        // Header
        doc.setFontSize(20);
        doc.setFont('helvetica', 'bold');
        doc.text('My Todo List', margin, yPosition);

        yPosition += 10;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Generated on: ${new Date().toLocaleString()}`, margin, yPosition);

        // Line separator
        yPosition += 5;
        doc.setDrawColor(200, 200, 200);
        doc.line(margin, yPosition, pageWidth - margin, yPosition);
        yPosition += 10;

        // Group tasks by status
        const todoTasks = tasks.filter(t => t.status === 'todo');
        const inProgressTasks = tasks.filter(t => t.status === 'in-progress');
        const doneTasks = tasks.filter(t => t.status === 'done');

        // Function to add section
        const addSection = (title, taskList, color) => {
            if (taskList.length === 0) return;

            // Check if we need a new page
            if (yPosition > pageHeight - 40) {
                doc.addPage();
                yPosition = margin;
            }

            // Section title
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(color[0], color[1], color[2]);
            doc.text(title, margin, yPosition);
            yPosition += 8;

            // Reset color
            doc.setTextColor(0, 0, 0);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(10);

            // Add tasks
            taskList.forEach((task, index) => {
                // Check page break
                if (yPosition > pageHeight - 30) {
                    doc.addPage();
                    yPosition = margin;
                }

                // Task number
                doc.setFont('helvetica', 'bold');
                doc.text(`${index + 1}.`, margin, yPosition);

                // Task title
                doc.setFont('helvetica', 'bold');
                const titleLines = doc.splitTextToSize(task.title, pageWidth - margin * 2 - 10);
                doc.text(titleLines, margin + 8, yPosition);
                yPosition += titleLines.length * 5;

                // Task details
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(9);

                // Description
                if (task.description) {
                    const descLines = doc.splitTextToSize(`Description: ${task.description}`, pageWidth - margin * 2 - 10);
                    doc.text(descLines, margin + 8, yPosition);
                    yPosition += descLines.length * 4;
                }

                // Due date and time
                if (task.dueDate) {
                    const dueDate = task.dueDate.toDate ? task.dueDate.toDate() : new Date(task.dueDate);
                    const dayName = dueDate.toLocaleDateString('en-US', { weekday: 'long' });
                    const dateStr = dueDate.toLocaleDateString();
                    const timeStr = task.dueTime || 'No time set';

                    doc.text(`Due: ${dayName}, ${dateStr} at ${timeStr}`, margin + 8, yPosition);
                    yPosition += 4;
                }

                // Priority
                if (task.priority) {
                    const priorityColors = {
                        high: [220, 38, 38],
                        medium: [245, 158, 11],
                        low: [34, 197, 94]
                    };
                    const color = priorityColors[task.priority] || [100, 100, 100];
                    doc.setTextColor(color[0], color[1], color[2]);
                    doc.text(`Priority: ${task.priority.toUpperCase()}`, margin + 8, yPosition);
                    doc.setTextColor(0, 0, 0);
                    yPosition += 4;
                }

                // Created date
                if (task.createdAt) {
                    const createdDate = task.createdAt.toDate ? task.createdAt.toDate() : new Date(task.createdAt);
                    doc.text(`Created: ${createdDate.toLocaleDateString()}`, margin + 8, yPosition);
                    yPosition += 4;
                }

                // Separator line
                yPosition += 2;
                doc.setDrawColor(230, 230, 230);
                doc.line(margin, yPosition, pageWidth - margin, yPosition);
                yPosition += 6;

                doc.setFontSize(10);
            });

            yPosition += 5;
        };

        // Add sections
        addSection(`📋 To Do (${todoTasks.length})`, todoTasks, [59, 130, 246]);
        addSection(`🔄 In Progress (${inProgressTasks.length})`, inProgressTasks, [245, 158, 11]);
        addSection(`✅ Done (${doneTasks.length})`, doneTasks, [34, 197, 94]);

        // Footer on last page
        const totalPages = doc.internal.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(150, 150, 150);
            doc.text(
                `Page ${i} of ${totalPages}`,
                pageWidth / 2,
                pageHeight - 10,
                { align: 'center' }
            );
        }

        // Save PDF
        const fileName = `TodoList_${new Date().toISOString().split('T')[0]}.pdf`;
        doc.save(fileName);

        console.log('PDF downloaded:', fileName);
        return { success: true, message: 'PDF downloaded successfully!' };

    } catch (error) {
        console.error('Error generating PDF:', error);
        alert('Failed to generate PDF: ' + error.message);
        return { success: false, message: error.message };
    }
}

// Load all tasks from Firestore for PDF
async function loadAllTasksForPDF() {
    try {
        const user = firebase.auth().currentUser;
        if (!user) {
            throw new Error('User not authenticated');
        }

        const tasksSnapshot = await db.collection('tasks')
            .where('userId', '==', user.uid)
            .orderBy('createdAt', 'desc')
            .get();

        const tasks = [];
        tasksSnapshot.forEach(doc => {
            tasks.push({ id: doc.id, ...doc.data() });
        });

        return tasks;
    } catch (error) {
        console.error('Error loading tasks for PDF:', error);
        // If Firestore query fails, try to get from DOM
        return getTasksFromDOM();
    }
}

// Fallback: Get tasks from DOM if Firestore fails
function getTasksFromDOM() {
    const tasks = [];
    const taskCards = document.querySelectorAll('.task-card');

    taskCards.forEach((card, index) => {
        const title = card.querySelector('.task-title')?.textContent || `Task ${index + 1}`;
        const description = card.querySelector('.task-description')?.textContent || '';
        const status = card.closest('.column')?.dataset.status || 'todo';
        const priority = card.dataset.priority || 'medium';
        const dueDate = card.dataset.dueDate ? new Date(card.dataset.dueDate) : null;
        const dueTime = card.dataset.dueTime || '';

        tasks.push({
            title,
            description,
            status,
            priority,
            dueDate,
            dueTime,
            createdAt: new Date()
        });
    });

    return tasks;
}

// Generate summary statistics for PDF
function generateTaskSummary(tasks) {
    const summary = {
        total: tasks.length,
        todo: tasks.filter(t => t.status === 'todo').length,
        inProgress: tasks.filter(t => t.status === 'in-progress').length,
        done: tasks.filter(t => t.status === 'done').length,
        highPriority: tasks.filter(t => t.priority === 'high').length,
        overdue: 0
    };

    // Count overdue tasks
    const now = new Date();
    tasks.forEach(task => {
        if (task.dueDate && task.status !== 'done') {
            const dueDate = task.dueDate.toDate ? task.dueDate.toDate() : new Date(task.dueDate);
            if (dueDate < now) {
                summary.overdue++;
            }
        }
    });

    return summary;
}

console.log('📄 PDF Generator loaded');
