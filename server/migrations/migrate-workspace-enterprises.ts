import { db } from "../db";
import { enterprises, crmWorkspaceEnterprises } from "@shared/schema";
import { eq, isNull } from "drizzle-orm";

export async function migrateWorkspaceEnterprises() {
  console.log("Starting workspace enterprises migration...");

  const orphanedEnterprises = await db
    .select()
    .from(crmWorkspaceEnterprises)
    .where(isNull(crmWorkspaceEnterprises.directoryEnterpriseId));

  if (orphanedEnterprises.length === 0) {
    console.log("No workspace-only enterprises found. Migration not needed.");
    return { migrated: 0, total: 0 };
  }

  console.log(`Found ${orphanedEnterprises.length} workspace-only enterprise(s) to migrate.`);

  let migratedCount = 0;

  for (const workspaceEnterprise of orphanedEnterprises) {
    try {
      console.log(`Migrating workspace enterprise: ${workspaceEnterprise.name} (ID: ${workspaceEnterprise.id})`);

      const [newDirectoryEnterprise] = await db
        .insert(enterprises)
        .values({
          name: workspaceEnterprise.name,
          description: workspaceEnterprise.description,
          category: workspaceEnterprise.category,
          location: workspaceEnterprise.location,
          website: workspaceEnterprise.website,
          contactEmail: workspaceEnterprise.contactEmail,
          tags: workspaceEnterprise.tags,
          isVerified: false,
          isFeatured: false,
        })
        .returning();

      await db
        .update(crmWorkspaceEnterprises)
        .set({
          directoryEnterpriseId: newDirectoryEnterprise.id,
          updatedAt: new Date(),
        })
        .where(eq(crmWorkspaceEnterprises.id, workspaceEnterprise.id));

      console.log(`✓ Created directory enterprise ${newDirectoryEnterprise.id} and linked to workspace enterprise ${workspaceEnterprise.id}`);
      migratedCount++;
    } catch (error) {
      console.error(`✗ Failed to migrate workspace enterprise ${workspaceEnterprise.id}:`, error);
    }
  }

  console.log(`Migration complete: ${migratedCount}/${orphanedEnterprises.length} enterprises migrated successfully.`);

  return { migrated: migratedCount, total: orphanedEnterprises.length };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  migrateWorkspaceEnterprises()
    .then((result) => {
      console.log("Migration result:", result);
      process.exit(0);
    })
    .catch((error) => {
      console.error("Migration failed:", error);
      process.exit(1);
    });
}
