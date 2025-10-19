/**
 * Firestore Migration Script: V1 → V2
 * 
 * Migrates from single-canvas architecture to multi-tenant workspaces.
 * 
 * WHAT THIS DOES:
 * 1. For each user, creates a default workspace
 * 2. Creates a default canvas in that workspace
 * 3. Migrates all their shapes to the new canvas
 * 4. Updates shapes with workspaceId and canvasId
 * 
 * USAGE:
 *   # Dry run (no changes, just preview)
 *   node scripts/migrate-to-v2.js --dry-run
 * 
 *   # Actually migrate
 *   node scripts/migrate-to-v2.js --execute
 * 
 * SAFETY:
 * - Always run with --dry-run first!
 * - Backup your database before running with --execute
 * - Test on staging environment before production
 */

import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  query,
  where,
  serverTimestamp
} from 'firebase/firestore';

// Firebase config (you'll need to set this up)
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Check command line args
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const isExecute = args.includes('--execute');

if (!isDryRun && !isExecute) {
  console.error('❌ ERROR: You must specify --dry-run or --execute');
  console.log('\nUsage:');
  console.log('  node scripts/migrate-to-v2.js --dry-run   (preview changes)');
  console.log('  node scripts/migrate-to-v2.js --execute    (actually migrate)');
  process.exit(1);
}

// Migration stats
const stats = {
  usersFound: 0,
  workspacesCreated: 0,
  canvasesCreated: 0,
  shapesUpdated: 0,
  errors: []
};

/**
 * Get all unique user IDs from shapes collection
 */
async function getAllUserIds() {
  console.log('\n📊 Finding all users...');
  
  const shapesSnapshot = await getDocs(collection(db, 'shapes'));
  const userIds = new Set();
  
  shapesSnapshot.docs.forEach(doc => {
    const data = doc.data();
    if (data.createdBy) {
      userIds.add(data.createdBy);
    }
  });
  
  console.log(`   Found ${userIds.size} unique users`);
  stats.usersFound = userIds.size;
  
  return Array.from(userIds);
}

/**
 * Create default workspace for a user
 */
async function createWorkspaceForUser(userId) {
  const workspace = {
    name: 'My Workspace',
    ownerId: userId,
    orgId: null,
    visibility: 'private',
    description: 'Your personal workspace',
    color: '#3b82f6',
    icon: '🎨',
    canvasCount: 1,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };
  
  if (isDryRun) {
    console.log(`   [DRY RUN] Would create workspace for user ${userId}`);
    return { id: `fake-workspace-${userId}`, ...workspace };
  }
  
  const docRef = await addDoc(collection(db, 'workspaces'), workspace);
  console.log(`   ✅ Created workspace ${docRef.id} for user ${userId}`);
  stats.workspacesCreated++;
  
  return { id: docRef.id, ...workspace };
}

/**
 * Create default canvas in workspace
 */
async function createCanvasForUser(userId, workspaceId) {
  const canvas = {
    name: 'Untitled Canvas',
    workspaceId,
    ownerId: userId,
    orgId: null,
    
    // Visibility & Sharing
    visibility: 'private',
    shareToken: null,
    sharePassword: null,
    shareExpiresAt: null,
    sharePermission: 'view',
    
    // Metadata
    description: 'Migrated from single-canvas setup',
    tags: [],
    category: null,
    
    // Thumbnail
    thumbnailUrl: null,
    thumbnailGeneratedAt: null,
    
    // Stats
    shapeCount: 0,
    viewCount: 0,
    forkCount: 0,
    
    // Soft Delete
    deletedAt: null,
    
    // State
    isStarred: false,
    
    // Timestamps
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    lastEditedAt: serverTimestamp(),
    lastEditedBy: userId
  };
  
  if (isDryRun) {
    console.log(`   [DRY RUN] Would create canvas for user ${userId}`);
    return { id: `fake-canvas-${userId}`, ...canvas };
  }
  
  const docRef = await addDoc(collection(db, 'canvases'), canvas);
  console.log(`   ✅ Created canvas ${docRef.id} for user ${userId}`);
  stats.canvasesCreated++;
  
  return { id: docRef.id, ...canvas };
}

/**
 * Migrate shapes for a user
 */
async function migrateShapesForUser(userId, canvasId, workspaceId) {
  // Find all shapes created by this user with old canvasId
  const q = query(
    collection(db, 'shapes'),
    where('createdBy', '==', userId),
    where('canvasId', '==', 'global-canvas-v1')
  );
  
  const shapesSnapshot = await getDocs(q);
  const shapeCount = shapesSnapshot.docs.length;
  
  if (shapeCount === 0) {
    console.log(`   📭 No shapes to migrate for user ${userId}`);
    return;
  }
  
  console.log(`   🔄 Migrating ${shapeCount} shapes for user ${userId}...`);
  
  for (const shapeDoc of shapesSnapshot.docs) {
    if (isDryRun) {
      console.log(`   [DRY RUN] Would update shape ${shapeDoc.id}`);
      stats.shapesUpdated++;
      continue;
    }
    
    try {
      await updateDoc(doc(db, 'shapes', shapeDoc.id), {
        canvasId: canvasId,
        workspaceId: workspaceId,
        updatedAt: serverTimestamp()
      });
      
      stats.shapesUpdated++;
    } catch (error) {
      console.error(`   ❌ Error updating shape ${shapeDoc.id}:`, error.message);
      stats.errors.push({
        shapeId: shapeDoc.id,
        error: error.message
      });
    }
  }
  
  console.log(`   ✅ Migrated ${shapeCount} shapes`);
}

/**
 * Main migration function
 */
async function migrate() {
  console.log('\n🚀 Starting Firestore Migration: V1 → V2');
  console.log(`   Mode: ${isDryRun ? 'DRY RUN (no changes)' : 'EXECUTE (will modify database)'}`);
  console.log('   ─────────────────────────────────────\n');
  
  if (isExecute) {
    console.log('⚠️  WARNING: This will modify your database!');
    console.log('   Make sure you have a backup before proceeding.\n');
    
    // Give user 5 seconds to cancel
    console.log('   Starting in 5 seconds... (Ctrl+C to cancel)');
    await new Promise(resolve => setTimeout(resolve, 5000));
    console.log('');
  }
  
  try {
    // Step 1: Get all users
    const userIds = await getAllUserIds();
    
    if (userIds.length === 0) {
      console.log('\n✅ No users found. Nothing to migrate.');
      return;
    }
    
    // Step 2: For each user, create workspace + canvas + migrate shapes
    console.log('\n🔄 Migrating users...\n');
    
    for (const userId of userIds) {
      console.log(`👤 Processing user: ${userId}`);
      
      try {
        // Create workspace
        const workspace = await createWorkspaceForUser(userId);
        
        // Create canvas
        const canvas = await createCanvasForUser(userId, workspace.id);
        
        // Migrate shapes
        await migrateShapesForUser(userId, canvas.id, workspace.id);
        
        console.log(`   ✅ Completed migration for user ${userId}\n`);
      } catch (error) {
        console.error(`   ❌ Error migrating user ${userId}:`, error.message);
        stats.errors.push({
          userId,
          error: error.message
        });
      }
    }
    
    // Step 3: Print summary
    printSummary();
    
  } catch (error) {
    console.error('\n❌ FATAL ERROR:', error);
    process.exit(1);
  }
}

/**
 * Print migration summary
 */
function printSummary() {
  console.log('\n═══════════════════════════════════════');
  console.log('   MIGRATION SUMMARY');
  console.log('═══════════════════════════════════════\n');
  
  console.log(`   Users found:         ${stats.usersFound}`);
  console.log(`   Workspaces created:  ${stats.workspacesCreated}`);
  console.log(`   Canvases created:    ${stats.canvasesCreated}`);
  console.log(`   Shapes updated:      ${stats.shapesUpdated}`);
  console.log(`   Errors encountered:  ${stats.errors.length}`);
  
  if (stats.errors.length > 0) {
    console.log('\n⚠️  ERRORS:\n');
    stats.errors.forEach(err => {
      console.log(`   • ${err.shapeId || err.userId}: ${err.error}`);
    });
  }
  
  if (isDryRun) {
    console.log('\n✅ DRY RUN COMPLETE - No changes were made');
    console.log('   To actually migrate, run with --execute');
  } else {
    console.log('\n✅ MIGRATION COMPLETE');
    console.log('   Your database has been migrated to V2!');
  }
  
  console.log('\n═══════════════════════════════════════\n');
}

// Run migration
migrate()
  .then(() => {
    console.log('👋 Migration script finished');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  });

