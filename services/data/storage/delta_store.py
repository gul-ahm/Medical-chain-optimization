import structlog
from typing import Dict, Any, List, Optional
from pyspark.sql import SparkSession, DataFrame
from delta.tables import DeltaTable

logger = structlog.get_logger(__name__)

class DeltaStore:
    """
    Enterprise Delta Lake Storage Layer.
    Provides ACID-compliant persistence with versioning and time-travel for the supply chain lakehouse.
    """
    def __init__(self):
        self.spark = SparkSession.builder \
            .appName("DeltaStore") \
            .config("spark.sql.extensions", "io.delta.sql.DeltaSparkSessionExtension") \
            .config("spark.sql.catalog.spark_catalog", "org.apache.spark.sql.delta.catalog.DeltaCatalog") \
            .getOrCreate()

    def upsert_inventory(self, df: DataFrame, table_path: str):
        """
        Performs an ACID-compliant upsert (MERGE) into the specified Delta table.
        Ensures inventory snapshots are updated without duplication.
        """
        logger.info("performing_delta_upsert", path=table_path)
        
        if not DeltaTable.isDeltaTable(self.spark, table_path):
            # Initial write
            df.write.format("delta").partitionBy("warehouse_id").save(table_path)
            return

        delta_table = DeltaTable.forPath(self.spark, table_path)
        
        delta_table.alias("target").merge(
            df.alias("updates"),
            "target.sku = updates.sku AND target.warehouse_id = updates.warehouse_id"
        ).whenMatchedUpdateAll() \
         .whenNotMatchedInsertAll() \
         .execute()
         
        logger.info("delta_upsert_completed", path=table_path)

    def get_snapshot_at_version(self, table_path: str, version: int) -> DataFrame:
        """
        Retrieves a historical snapshot of the data using Delta Time Travel.
        """
        logger.info("retrieving_delta_time_travel", version=version, path=table_path)
        return self.spark.read.format("delta").option("versionAsOf", version).load(table_path)

    def vacuum_table(self, table_path: str, retention_hours: int = 168):
        """
        Cleans up old data versions to optimize storage while maintaining the retention window.
        """
        logger.info("vacuuming_delta_table", path=table_path, retention=retention_hours)
        delta_table = DeltaTable.forPath(self.spark, table_path)
        delta_table.vacuum(retention_hours)

# ── Singleton Instance ──
delta_store = DeltaStore()
