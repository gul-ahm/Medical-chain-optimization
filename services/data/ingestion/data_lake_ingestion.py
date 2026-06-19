import structlog
from typing import Dict, Any, List, Optional
from pyspark.sql import SparkSession, DataFrame
from pyspark.sql.functions import from_json, col
from pyspark.sql.types import StructType, StructField, StringType, DoubleType, TimestampType

logger = structlog.get_logger(__name__)

class DataLakeIngestion:
    """
    Enterprise Data Lake Ingestion Framework.
    Orchestrates batch and streaming ingestion of supply chain datasets into the analytical lakehouse.
    """
    def __init__(self, app_name: str = "SC_Intelligence_Ingestion"):
        self.spark = SparkSession.builder \
            .appName(app_name) \
            .getOrCreate()
        
        self.inventory_schema = StructType([
            StructField("sku", StringType(), False),
            StructField("warehouse_id", StringType(), False),
            StructField("quantity", DoubleType(), False),
            StructField("timestamp", TimestampType(), False)
        ])

    def ingest_streaming_inventory(self, kafka_bootstrap: str, topic: str):
        """
        Executes a Spark Structured Streaming pipeline to ingest inventory events from Kafka.
        """
        logger.info("starting_streaming_ingestion", topic=topic)
        
        df = self.spark.readStream \
            .format("kafka") \
            .option("kafka.bootstrap.servers", kafka_bootstrap) \
            .option("subscribe", topic) \
            .load()

        # Parse JSON payload
        parsed_df = df.selectExpr("CAST(value AS STRING)") \
            .select(from_json(col("value"), self.inventory_schema).alias("data")) \
            .select("data.*")

        # Write to Delta Lake or Parquet (Sink)
        query = parsed_df.writeStream \
            .format("parquet") \
            .option("path", "/mnt/datalake/raw/inventory") \
            .option("checkpointLocation", "/mnt/datalake/checkpoints/inventory") \
            .outputMode("append") \
            .start()
            
        return query

    def ingest_batch_sales(self, path: str):
        """
        Performs batch ingestion of historical sales data from the landing zone.
        """
        logger.info("starting_batch_ingestion", source=path)
        
        df = self.spark.read.format("csv") \
            .option("header", "true") \
            .option("inferSchema", "true") \
            .load(path)
            
        # Delta Write
        df.write.format("parquet") \
            .mode("append") \
            .save("/mnt/datalake/raw/sales")
            
        logger.info("batch_ingestion_completed", rows=df.count())

# ── Singleton Instance ──
datalake_ingestion = DataLakeIngestion()
