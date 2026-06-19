class TopicRegistry:
    # Inventory Domain (Events)
    INVENTORY_DEDUCTED = "evt.inventory.deducted"
    INVENTORY_RESERVED = "evt.inventory.reserved"
    INVENTORY_RELEASED = "evt.inventory.released"
    
    # Inventory Domain (Commands)
    CMD_RESERVE_STOCK = "cmd.inventory.reserve"
    CMD_DEDUCT_STOCK = "cmd.inventory.deduct"
    CMD_RELEASE_STOCK = "cmd.inventory.release"
    
    # Forecasting Domain
    FORECAST_GENERATED = "evt.forecast.generated"
    
    # Optimization Domain
    OPTIMIZATION_GENERATED = "evt.optimization.generated"
    TRANSFER_RECOMMENDED = "evt.transfer.recommended"
    
    # Governance Domain
    APPROVAL_REQUESTED = "evt.approval.requested"
    APPROVAL_APPROVED = "evt.approval.approved"
    APPROVAL_REJECTED = "evt.approval.rejected"
    
    # Saga Domain
    SAGA_COMPLETED = "evt.saga.completed"
    SAGA_COMPENSATED = "evt.saga.compensated"

    @classmethod
    def get_dlq_for_topic(cls, topic: str) -> str:
        domain = topic.split('.')[1]
        return f"evt.{domain}.dlq"
