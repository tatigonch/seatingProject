import React, { useRef, useImperativeHandle, forwardRef } from 'react';
import { Box, Paper, Typography } from '@mui/material';
import html2canvas from 'html2canvas';

const DeskGrid = forwardRef(({ desks, columnCount = 3 }, ref) => {
  const printRef = useRef(null);

  const handleScreenshot = async () => {
    try {
      const element = printRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#ffffff',
        width: element.scrollWidth,
        height: element.scrollHeight,
        scrollX: 0,
        scrollY: 0,
      });

      const link = document.createElement('a');
      link.download = `схема-класса-${new Date().toLocaleDateString('ru-RU')}.png`;
      link.href = canvas.toDataURL('image/png');

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Ошибка при создании скриншота:', error);
      alert('Произошла ошибка при создании скриншота');
    }
  };

  useImperativeHandle(ref, () => ({
    takeScreenshot: handleScreenshot
  }));

  const renderStudent = (student) => {
    if (!student) {
      return (
        <Box 
          sx={{ 
            height: 60, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            bgcolor: 'grey.100',
            borderRadius: 1,
            border: '1px dashed',
            borderColor: 'grey.300'
          }}
        >
          <Typography variant="caption" color="textSecondary">
            Свободно
          </Typography>
        </Box>
      );
    }

    const getVisionColor = (vision) => {
      switch (vision) {
        case 'Плохое': return '#ffebee';
        case 'Среднее': return '#fff3e0';
        case 'Хорошее': return '#e8f5e8';
        default: return '#f5f5f5';
      }
    };

    const getHeightBorder = (height) => {
      const numHeight = parseInt(height);
      if (numHeight < 160) return '2px solid #2196f3'; // Низкий - синий
      if (numHeight >= 160 && numHeight < 175) return '2px solid #4caf50'; // Средний - зеленый  
      if (numHeight >= 175) return '2px solid #ff9800'; // Высокий - оранжевый
      return '2px solid #e0e0e0';
    };

    const nameParts = student.getFullName().split(' ');
    const lastName = nameParts[0] || '';
    const firstName = nameParts.slice(1).join(' ') || '';

    return (
      <Box
        className="student-box"
        sx={{
          height: 60,
          p: 0.5,
          bgcolor: getVisionColor(student.getVision()),
          border: getHeightBorder(student.getHeight()),
          borderRadius: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          position: 'relative'
        }}
      >
        <Typography
          variant="caption"
          sx={{
            fontWeight: 'medium',
            lineHeight: 1.1,
            textAlign: 'center',
            fontSize: '0.7rem',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}
        >
          {lastName}
        </Typography>
        <Typography
          variant="caption"
          sx={{
            fontWeight: 'normal',
            lineHeight: 1.1,
            textAlign: 'center',
            fontSize: '0.65rem',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}
        >
          {firstName}
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.2, mt: 0.2 }}>
          <Typography variant="caption" sx={{ fontSize: '0.6rem', color: 'text.secondary' }}>
            {student.getVision().charAt(0)}
          </Typography>
          <Typography variant="caption" sx={{ fontSize: '0.6rem', color: 'text.secondary' }}>
            {student.getHeight()}см
          </Typography>
        </Box>
        {student.getConflicts().size > 0 && (
          <Box
            sx={{
              position: 'absolute',
              top: -2,
              right: -2,
              width: 8,
              height: 8,
              bgcolor: 'error.main',
              borderRadius: '50%',
              fontSize: '0.6rem'
            }}
            title={`Конфликты: ${Array.from(student.getConflicts()).map(s => s.getFullName()).join(', ')}`}
          />
        )}
      </Box>
    );
  };

  const renderDesk = (desk, index) => {
    
    return (
      <Paper 
        key={index}
        elevation={2}
        sx={{ 
          p: 1,
          minHeight: 100,
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
          bgcolor: 'white',
          border: '1px solid',
          borderColor: 'grey.300',
          '&:hover': {
            elevation: 4,
            borderColor: 'primary.main'
          }
        }}
      >
        <Typography 
          variant="caption" 
          color="textSecondary" 
          sx={{ textAlign: 'center', fontWeight: 'medium' }}
        >
          Парта {index + 1}
        </Typography>
        
        {/* Горизонтальное расположение учеников */}
        <Box sx={{ display: 'flex', gap: 1, flex: 1 }}>
          <Box sx={{ flex: 1 }}>
            {renderStudent(desk.getStudent1())}
          </Box>
          <Box sx={{ flex: 1 }}>
            {renderStudent(desk.getStudent2())}
          </Box>
        </Box>
      </Paper>
    );
  };

  return (
    <Box sx={{ p: 2, minWidth: 400 }}>
      <Box ref={printRef} className="desk-grid-container">
      {/* Board - made longer and thinner */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'center' }}>
        <Paper 
          elevation={1}
          className="board-paper"
          sx={{ 
            px: 8, 
            py: 0.5, 
            bgcolor: 'grey.100',
            border: '2px solid',
            borderColor: 'grey.400',
            minWidth: '70%',
            width: 'fit-content',
            height: 32
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 'medium', textAlign: 'center' }}>
            Доска
          </Typography>
        </Paper>
      </Box>

      {/* Teacher's Desk above first row */}
      <Box sx={{ mb: 2, maxWidth: 600, mx: 'auto' }}>
        <Box 
          sx={{ 
            display: 'grid',
            gridTemplateColumns: `repeat(${columnCount}, 1fr)`,
            gap: 2,
            mb: 1
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <Paper 
              elevation={2}
              className="teacher-desk"
              sx={{ 
                p: 1.5, 
                minHeight: 60,
                minWidth: 120,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'primary.50',
                border: '1px solid',
                borderColor: 'primary.200'
              }}
            >
              <Typography variant="caption" sx={{ fontWeight: 'medium', textAlign: 'center' }}>
                Стол учителя
              </Typography>
            </Paper>
          </Box>
          <Box></Box>
          <Box></Box>
        </Box>
      </Box>

      {/* Student Desks Grid */}
      <Box sx={{ mb: 2 }}>
        <Box 
          sx={{ 
            display: 'grid',
            gridTemplateColumns: `repeat(${columnCount}, 1fr)`,
            gap: 2,
            maxWidth: 600,
            mx: 'auto'
          }}
        >
          {desks.map((desk, index) => renderDesk(desk, index))}
        </Box>
      </Box>

      {/* Legend */}
      <Box className="legend" sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'medium' }}>
          Легенда:
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, fontSize: '0.8rem' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ width: 12, height: 12, bgcolor: '#ffebee', border: '1px solid #f44336' }} />
            <Typography variant="caption">Плохое зрение</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ width: 12, height: 12, bgcolor: '#fff3e0', border: '1px solid #ff9800' }} />
            <Typography variant="caption">Среднее зрение</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ width: 12, height: 12, bgcolor: '#e8f5e8', border: '1px solid #4caf50' }} />
            <Typography variant="caption">Хорошее зрение</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ width: 8, height: 8, bgcolor: 'error.main', borderRadius: '50%' }} />
            <Typography variant="caption">Есть конфликты</Typography>
          </Box>
        </Box>
        <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
          Границы: Синий - низкий рост (&lt;160см), Зеленый - средний рост (160-174см), Оранжевый - высокий рост (≥175см)
        </Typography>
      </Box>
      </Box>
    </Box>
  );
});

export default DeskGrid;