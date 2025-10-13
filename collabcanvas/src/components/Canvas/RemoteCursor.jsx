import { Group, Circle, Text, Line } from 'react-konva';

/**
 * RemoteCursor component - renders another user's cursor position on the canvas
 * @param {Object} cursor - Cursor data { userId, userName, x, y }
 */
function RemoteCursor({ cursor }) {
  // Generate a consistent color for each user based on their userId
  const userColor = getUserColor(cursor.userId);

  return (
    <Group x={cursor.x} y={cursor.y}>
      {/* Cursor pointer (arrow-like shape) */}
      <Line
        points={[0, 0, 0, 20, 5, 15, 0, 0]}
        fill={userColor}
        stroke="#000"
        strokeWidth={1}
        closed
        listening={false}
      />
      
      {/* User name label */}
      <Group x={8} y={8}>
        {/* Label background */}
        <Text
          text={cursor.userName}
          fontSize={12}
          fontStyle="bold"
          fill={userColor}
          padding={4}
          listening={false}
          shadowColor="rgba(0, 0, 0, 0.8)"
          shadowBlur={4}
          shadowOffset={{ x: 0, y: 1 }}
          shadowOpacity={1}
        />
      </Group>
    </Group>
  );
}

/**
 * Generate a consistent color for a user based on their userId
 * @param {string} userId - User ID
 * @returns {string} Hex color code
 */
function getUserColor(userId) {
  // Predefined nice colors for cursors
  const colors = [
    '#646cff', // Blue
    '#4ade80', // Green
    '#f59e0b', // Orange
    '#ec4899', // Pink
    '#8b5cf6', // Purple
    '#06b6d4', // Cyan
    '#f43f5e', // Red
    '#84cc16', // Lime
    '#eab308', // Yellow
    '#14b8a6', // Teal
  ];

  // Generate a hash from userId to get consistent color
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const index = Math.abs(hash) % colors.length;
  return colors[index];
}

export default RemoteCursor;
