import { Desk } from '../models/Desk';

export const arrangeStudents = (students, currentDesks) => {
  // Create new desks array to avoid mutation
  const desks = currentDesks.map(() => new Desk());
  const columnCount = 3;

  // Helper functions - same logic as Java version
  const getVisionPriority = (vision) => {
    switch (vision) {
      case 'Плохое': return 1;
      case 'Среднее': return 2;
      case 'Хорошее': return 3;
      default: return 4;
    }
  };

  const getHeightPriority = (height) => {
    const numHeight = parseInt(height);
    if (numHeight < 160) return 1; // Низкий
    if (numHeight >= 160 && numHeight < 175) return 2; // Средний
    if (numHeight >= 175) return 3; // Высокий
    return 2; // default средний
  };

  const shuffleMaintainingOrder = (studentsList) => {
    const chunkSize = Math.max(1, Math.floor(studentsList.length / 5));
    const shuffledList = [];

    for (let i = 0; i < studentsList.length; i += chunkSize) {
      const chunk = studentsList.slice(i, Math.min(studentsList.length, i + chunkSize));
      // Shuffle chunk
      for (let j = chunk.length - 1; j > 0; j--) {
        const k = Math.floor(Math.random() * (j + 1));
        [chunk[j], chunk[k]] = [chunk[k], chunk[j]];
      }
      shuffledList.push(...chunk);
    }
    return shuffledList;
  };

  const findFreeSeat = (student, deskIndex) => {
    if (deskIndex >= desks.length) {
      desks.push(new Desk());
    }
    const desk = desks[deskIndex];
    if (!desk.getStudent1()) {
      desk.setStudent1(student);
    } else {
      desk.setStudent2(student);
    }
  };

  // Clear all desks first
  desks.forEach(desk => desk.clear());

  // Separate students into priority groups - same logic as Java
  const highAndBadVisionStudents = students
    .filter(s => s.getVision().includes('Плохое') && parseInt(s.getHeight()) >= 175)
    .sort((a, b) => {
      const visionCompare = getVisionPriority(a.getVision()) - getVisionPriority(b.getVision());
      if (visionCompare !== 0) return visionCompare;
      
      const heightCompare = getHeightPriority(a.getHeight()) - getHeightPriority(b.getHeight());
      if (heightCompare !== 0) return heightCompare;
      
      return a.getConflicts().size - b.getConflicts().size;
    });

  const otherStudents = students
    .filter(s => !(s.getVision().includes('Плохое') && parseInt(s.getHeight()) >= 175))
    .sort((a, b) => {
      const visionCompare = getVisionPriority(a.getVision()) - getVisionPriority(b.getVision());
      if (visionCompare !== 0) return visionCompare;
      
      const heightCompare = getHeightPriority(a.getHeight()) - getHeightPriority(b.getHeight());
      if (heightCompare !== 0) return heightCompare;
      
      return a.getConflicts().size - b.getConflicts().size;
    });

  // Shuffle maintaining order
  const shuffledHighAndBad = shuffleMaintainingOrder(highAndBadVisionStudents);
  const shuffledOthers = shuffleMaintainingOrder(otherStudents);

  // Place high and bad vision students first - same logic as Java
  let deskIndex = 0;
  let leftRowCount = 0;
  let rightRowCount = 0;

  for (const student of shuffledHighAndBad) {
    let placed = false;
    while (deskIndex < desks.length && !placed) {
      const desk = desks[deskIndex];
      const isLeftRow = deskIndex % columnCount === 0;
      const isRightRow = deskIndex % columnCount === columnCount - 1;

      if (isLeftRow && !desk.getStudent1() && leftRowCount < 3) {
        desk.setStudent1(student);
        leftRowCount++;
        placed = true;
      } else if (isRightRow && !desk.getStudent2() && rightRowCount < 3) {
        desk.setStudent2(student);
        rightRowCount++;
        placed = true;
      } else {
        deskIndex++;
      }
    }

    if (!placed) {
      shuffledOthers.push(student);
    }
  }

  // Place other students - basic placement without preferred neighbors
  deskIndex = 0;
  for (const student of shuffledOthers) {
    if (deskIndex >= desks.length) {
      desks.push(new Desk());
    }
    const desk = desks[deskIndex];

    if (!desk.getStudent1()) {
      if (!desk.getStudent2() || !desk.getStudent2().getConflicts().has(student)) {
        desk.setStudent1(student);
      } else {
        findFreeSeat(student, deskIndex + 1);
      }
    } else if (!desk.getStudent2()) {
      if (!desk.getStudent1().getConflicts().has(student)) {
        desk.setStudent2(student);
        deskIndex++;
      } else {
        findFreeSeat(student, deskIndex + 1);
      }
    } else {
      deskIndex++;
      findFreeSeat(student, deskIndex);
    }
  }

  // After basic placement, try to arrange preferred neighbors on the same desk
  applyPreferredNeighbors(desks, students);

  return desks;
};

// Helper function to apply preferred neighbor logic after initial placement
const applyPreferredNeighbors = (desks, students) => {
  // Build a map of student to desk index and position
  const studentLocation = new Map();
  desks.forEach((desk, deskIndex) => {
    if (desk.getStudent1()) {
      studentLocation.set(desk.getStudent1(), { deskIndex, position: 1 });
    }
    if (desk.getStudent2()) {
      studentLocation.set(desk.getStudent2(), { deskIndex, position: 2 });
    }
  });

  // Try to swap students to place preferred neighbors together
  for (const student of students) {
    const preferredNeighbors = Array.from(student.getPreferredNeighbors());
    if (preferredNeighbors.length === 0) continue;

    const studentLoc = studentLocation.get(student);
    if (!studentLoc) continue;

    const studentDesk = desks[studentLoc.deskIndex];
    const deskmate = studentLoc.position === 1
      ? studentDesk.getStudent2()
      : studentDesk.getStudent1();

    // Check if already sitting with preferred neighbor
    if (deskmate && student.getPreferredNeighbors().has(deskmate)) {
      continue;
    }

    // Try to find a preferred neighbor to swap with
    for (const preferredNeighbor of preferredNeighbors) {
      const preferredLoc = studentLocation.get(preferredNeighbor);
      if (!preferredLoc) continue;

      // Check if they would conflict
      if (student.getConflicts().has(preferredNeighbor)) continue;

      const preferredDesk = desks[preferredLoc.deskIndex];
      const preferredDeskmate = preferredLoc.position === 1
        ? preferredDesk.getStudent2()
        : preferredDesk.getStudent1();

      // Try swapping: move preferredNeighbor to sit with student
      // and move deskmate to sit with preferredDeskmate (if exists)

      // Validate the swap won't create conflicts
      let canSwap = true;

      // Check if preferredNeighbor and student are compatible (already checked above)

      // Check if deskmate and preferredDeskmate are compatible
      if (deskmate && preferredDeskmate) {
        if (deskmate.getConflicts().has(preferredDeskmate) ||
            preferredDeskmate.getConflicts().has(deskmate)) {
          canSwap = false;
        }
      }

      if (canSwap) {
        // Perform the swap
        if (studentLoc.position === 1) {
          studentDesk.setStudent2(preferredNeighbor);
        } else {
          studentDesk.setStudent1(preferredNeighbor);
        }

        if (preferredLoc.position === 1) {
          preferredDesk.setStudent1(deskmate);
        } else {
          preferredDesk.setStudent2(deskmate);
        }

        // Update location map
        if (deskmate) {
          studentLocation.set(deskmate, {
            deskIndex: preferredLoc.deskIndex,
            position: preferredLoc.position
          });
        }
        studentLocation.set(preferredNeighbor, {
          deskIndex: studentLoc.deskIndex,
          position: studentLoc.position === 1 ? 2 : 1
        });

        // Successfully placed preferred neighbor, stop searching
        break;
      }
    }
  }
};