import { PrismaClient } from '@prisma/client';
import cron from 'node-cron';

const prisma = new PrismaClient();

// Observer worker that runs every 30 minutes to check for new content
cron.schedule('*/30 * * * *', async () => {
  console.log('🕒 Observer: Checking for new content sources...');

  try {
    // Get all active content sources
    const contentSources = await prisma.contentSource.findMany({
      include: { institution: true },
    });

    for (const source of contentSources) {
      try {
        const hasNewContent = await checkForNewContent(source);

        if (hasNewContent) {
          console.log(`📝 New content detected for ${source.institution.name}`);

          // Create agent task for content generation
          await prisma.agentTask.create({
            data: {
              institutionId: source.institutionId,
              contentSourceId: source.id,
              taskType: 'content_generation',
              status: 'queued',
            },
          });

          // Update last synced timestamp
          await prisma.contentSource.update({
            where: { id: source.id },
            data: { lastSynced: new Date() },
          });
        }
      } catch (error) {
        console.error(`Error checking source ${source.id}:`, error);
      }
    }

    console.log('✅ Observer cycle completed');
  } catch (error) {
    console.error('Observer error:', error);
  }
});

// Content checking functions for different source types
async function checkForNewContent(source: any): Promise<boolean> {
  switch (source.sourceType.toLowerCase()) {
    case 'rss':
      return await checkRSSFeed(source.sourceUrl, source.lastSynced);
    case 'shopify':
      return await checkShopifyProducts(source.sourceUrl, source.lastSynced);
    case 'csv':
      return await checkCSVFile(source.sourceUrl, source.lastSynced);
    default:
      console.log(`Unsupported source type: ${source.sourceType}`);
      return false;
  }
}

async function checkRSSFeed(url: string, lastSynced: Date | null): Promise<boolean> {
  try {
    // TODO: Implement RSS feed parsing
    // Check if there are new items published after lastSynced
    // For now, simulate random new content detection
    return Math.random() > 0.7; // 30% chance of new content
  } catch (error) {
    console.error('RSS check error:', error);
    return false;
  }
}

async function checkShopifyProducts(url: string, lastSynced: Date | null): Promise<boolean> {
  try {
    // TODO: Implement Shopify API integration
    // Check for new products added after lastSynced
    // For now, simulate random new content detection
    return Math.random() > 0.8; // 20% chance of new products
  } catch (error) {
    console.error('Shopify check error:', error);
    return false;
  }
}

async function checkCSVFile(url: string, lastSynced: Date | null): Promise<boolean> {
  try {
    // TODO: Implement CSV file monitoring
    // Check if file has been modified after lastSynced
    // For now, simulate random new content detection
    return Math.random() > 0.9; // 10% chance of CSV updates
  } catch (error) {
    console.error('CSV check error:', error);
    return false;
  }
}

console.log('🚀 Observer worker started. Monitoring content sources every 30 minutes...');

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('🛑 Shutting down observer worker...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('🛑 Shutting down observer worker...');
  await prisma.$disconnect();
  process.exit(0);
});
