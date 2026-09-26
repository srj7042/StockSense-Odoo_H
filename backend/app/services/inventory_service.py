from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from datetime import datetime

from app import models

class InventoryService:
    @staticmethod
    def get_or_create_balance(db: Session, product_id: int, location_id: int) -> models.InventoryBalance:
        balance = db.query(models.InventoryBalance).filter(
            models.InventoryBalance.product_id == product_id,
            models.InventoryBalance.location_id == location_id
        ).with_for_update().first() if db.bind.name != "sqlite" else db.query(models.InventoryBalance).filter(
            models.InventoryBalance.product_id == product_id,
            models.InventoryBalance.location_id == location_id
        ).first()

        if not balance:
            balance = models.InventoryBalance(
                product_id=product_id,
                location_id=location_id,
                quantity=0.0
            )
            db.add(balance)
            db.flush()
        return balance

    @staticmethod
    def update_alerts_for_product(db: Session, product_id: int, location_id: int, current_qty: float):
        product = db.query(models.Product).filter(models.Product.id == product_id).first()
        if not product:
            return

        reorder_point = product.reorder_point

        # Resolve existing alerts if stock restored
        if current_qty > reorder_point:
            db.query(models.Alert).filter(
                models.Alert.product_id == product_id,
                models.Alert.location_id == location_id,
                models.Alert.status == "ACTIVE"
            ).update({"status": "RESOLVED"})
            return

        if current_qty == 0:
            alert = models.Alert(
                product_id=product_id,
                location_id=location_id,
                alert_type="OUT_OF_STOCK",
                severity="CRITICAL",
                message=f"Product '{product.name}' (SKU: {product.sku}) is completely OUT OF STOCK at location ID {location_id}.",
                status="ACTIVE"
            )
            db.add(alert)
        elif current_qty <= reorder_point:
            alert = models.Alert(
                product_id=product_id,
                location_id=location_id,
                alert_type="LOW_STOCK",
                severity="HIGH",
                message=f"Product '{product.name}' (SKU: {product.sku}) has reached low stock level ({current_qty} {product.unit} remaining, reorder point is {reorder_point}).",
                status="ACTIVE"
            )
            db.add(alert)

    @staticmethod
    def post_receipt(db: Session, receipt_id: int, user_id: int) -> models.Receipt:
        receipt = db.query(models.Receipt).filter(models.Receipt.id == receipt_id).first()
        if not receipt:
            raise HTTPException(status_code=404, detail="Receipt not found")
        if receipt.status == "POSTED":
            raise HTTPException(status_code=400, detail="Receipt is already posted")
        if receipt.status == "CANCELLED":
            raise HTTPException(status_code=400, detail="Cannot post a cancelled receipt")
        if not receipt.items:
            raise HTTPException(status_code=400, detail="Receipt has no product items")

        try:
            for item in receipt.items:
                if item.quantity <= 0:
                    raise HTTPException(status_code=400, detail=f"Quantity must be greater than zero for product ID {item.product_id}")
                
                balance = InventoryService.get_or_create_balance(db, item.product_id, receipt.destination_location_id)
                balance.quantity += item.quantity
                balance.updated_at = datetime.utcnow()

                movement = models.StockMovement(
                    reference_no=receipt.receipt_no,
                    movement_type="RECEIPT_IN",
                    product_id=item.product_id,
                    source_location_id=None,
                    destination_location_id=receipt.destination_location_id,
                    quantity_in=item.quantity,
                    quantity_out=0.0,
                    balance_after=balance.quantity,
                    reason=f"Posted Receipt {receipt.receipt_no}",
                    created_by=user_id,
                    created_at=datetime.utcnow()
                )
                db.add(movement)
                InventoryService.update_alerts_for_product(db, item.product_id, receipt.destination_location_id, balance.quantity)

            receipt.status = "POSTED"
            receipt.posted_by = user_id
            receipt.posted_at = datetime.utcnow()
            db.commit()
            db.refresh(receipt)
            return receipt
        except Exception as e:
            db.rollback()
            if isinstance(e, HTTPException):
                raise e
            raise HTTPException(status_code=500, detail=f"Failed to post receipt: {str(e)}")

    @staticmethod
    def post_delivery(db: Session, delivery_id: int, user_id: int) -> models.DeliveryOrder:
        delivery = db.query(models.DeliveryOrder).filter(models.DeliveryOrder.id == delivery_id).first()
        if not delivery:
            raise HTTPException(status_code=404, detail="Delivery order not found")
        if delivery.status == "POSTED":
            raise HTTPException(status_code=400, detail="Delivery order is already posted")
        if delivery.status == "CANCELLED":
            raise HTTPException(status_code=400, detail="Cannot post a cancelled delivery order")
        if not delivery.items:
            raise HTTPException(status_code=400, detail="Delivery order has no product items")

        try:
            # Validate stock availability first
            for item in delivery.items:
                if item.quantity <= 0:
                    raise HTTPException(status_code=400, detail=f"Quantity must be greater than zero")
                balance = InventoryService.get_or_create_balance(db, item.product_id, delivery.source_location_id)
                if balance.quantity < item.quantity:
                    product = db.query(models.Product).filter(models.Product.id == item.product_id).first()
                    pname = product.name if product else f"ID {item.product_id}"
                    raise HTTPException(
                        status_code=400,
                        detail=f"Requested: {item.quantity} units · Available: {balance.quantity} units for product '{pname}'"
                    )

            # Perform stock reduction & create ledger entries
            for item in delivery.items:
                balance = InventoryService.get_or_create_balance(db, item.product_id, delivery.source_location_id)
                balance.quantity -= item.quantity
                balance.updated_at = datetime.utcnow()

                movement = models.StockMovement(
                    reference_no=delivery.delivery_no,
                    movement_type="DELIVERY_OUT",
                    product_id=item.product_id,
                    source_location_id=delivery.source_location_id,
                    destination_location_id=None,
                    quantity_in=0.0,
                    quantity_out=item.quantity,
                    balance_after=balance.quantity,
                    reason=f"Posted Delivery {delivery.delivery_no}",
                    created_by=user_id,
                    created_at=datetime.utcnow()
                )
                db.add(movement)
                InventoryService.update_alerts_for_product(db, item.product_id, delivery.source_location_id, balance.quantity)

            delivery.status = "POSTED"
            delivery.posted_by = user_id
            delivery.posted_at = datetime.utcnow()
            db.commit()
            db.refresh(delivery)
            return delivery
        except Exception as e:
            db.rollback()
            if isinstance(e, HTTPException):
                raise e
            raise HTTPException(status_code=500, detail=f"Failed to post delivery order: {str(e)}")

    @staticmethod
    def post_transfer(db: Session, transfer_id: int, user_id: int) -> models.StockTransfer:
        transfer = db.query(models.StockTransfer).filter(models.StockTransfer.id == transfer_id).first()
        if not transfer:
            raise HTTPException(status_code=404, detail="Stock transfer not found")
        if transfer.status == "POSTED":
            raise HTTPException(status_code=400, detail="Stock transfer is already posted")
        if transfer.status == "CANCELLED":
            raise HTTPException(status_code=400, detail="Cannot post a cancelled transfer")
        if transfer.source_location_id == transfer.destination_location_id:
            raise HTTPException(status_code=400, detail="Source and destination locations cannot be the same")
        if not transfer.items:
            raise HTTPException(status_code=400, detail="Transfer has no product items")

        try:
            # Validate source stock
            for item in transfer.items:
                if item.quantity <= 0:
                    raise HTTPException(status_code=400, detail="Quantity must be greater than zero")
                src_balance = InventoryService.get_or_create_balance(db, item.product_id, transfer.source_location_id)
                if src_balance.quantity < item.quantity:
                    product = db.query(models.Product).filter(models.Product.id == item.product_id).first()
                    pname = product.name if product else f"ID {item.product_id}"
                    raise HTTPException(
                        status_code=400,
                        detail=f"Requested transfer: {item.quantity} units · Available at source: {src_balance.quantity} units for '{pname}'"
                    )

            # Perform transfer
            for item in transfer.items:
                src_balance = InventoryService.get_or_create_balance(db, item.product_id, transfer.source_location_id)
                dst_balance = InventoryService.get_or_create_balance(db, item.product_id, transfer.destination_location_id)

                src_balance.quantity -= item.quantity
                src_balance.updated_at = datetime.utcnow()

                dst_balance.quantity += item.quantity
                dst_balance.updated_at = datetime.utcnow()

                # Paired movement 1: Outbound from source
                m1 = models.StockMovement(
                    reference_no=transfer.transfer_no,
                    movement_type="TRANSFER_OUT",
                    product_id=item.product_id,
                    source_location_id=transfer.source_location_id,
                    destination_location_id=transfer.destination_location_id,
                    quantity_in=0.0,
                    quantity_out=item.quantity,
                    balance_after=src_balance.quantity,
                    reason=f"Transfer to location ID {transfer.destination_location_id}",
                    created_by=user_id,
                    created_at=datetime.utcnow()
                )
                # Paired movement 2: Inbound to destination
                m2 = models.StockMovement(
                    reference_no=transfer.transfer_no,
                    movement_type="TRANSFER_IN",
                    product_id=item.product_id,
                    source_location_id=transfer.source_location_id,
                    destination_location_id=transfer.destination_location_id,
                    quantity_in=item.quantity,
                    quantity_out=0.0,
                    balance_after=dst_balance.quantity,
                    reason=f"Transfer from location ID {transfer.source_location_id}",
                    created_by=user_id,
                    created_at=datetime.utcnow()
                )
                db.add(m1)
                db.add(m2)
                InventoryService.update_alerts_for_product(db, item.product_id, transfer.source_location_id, src_balance.quantity)
                InventoryService.update_alerts_for_product(db, item.product_id, transfer.destination_location_id, dst_balance.quantity)

            transfer.status = "POSTED"
            transfer.posted_by = user_id
            transfer.posted_at = datetime.utcnow()
            db.commit()
            db.refresh(transfer)
            return transfer
        except Exception as e:
            db.rollback()
            if isinstance(e, HTTPException):
                raise e
            raise HTTPException(status_code=500, detail=f"Failed to post stock transfer: {str(e)}")

    @staticmethod
    def post_adjustment(db: Session, adjustment_id: int, user_id: int) -> models.InventoryAdjustment:
        adj = db.query(models.InventoryAdjustment).filter(models.InventoryAdjustment.id == adjustment_id).first()
        if not adj:
            raise HTTPException(status_code=404, detail="Inventory adjustment not found")
        if adj.status == "POSTED":
            raise HTTPException(status_code=400, detail="Inventory adjustment is already posted")
        if adj.status == "CANCELLED":
            raise HTTPException(status_code=400, detail="Cannot post a cancelled adjustment")
        if not adj.reason:
            raise HTTPException(status_code=400, detail="Adjustment reason is mandatory")
        if not adj.items:
            raise HTTPException(status_code=400, detail="Adjustment has no product items")

        try:
            for item in adj.items:
                balance = InventoryService.get_or_create_balance(db, item.product_id, adj.location_id)
                current_sys = balance.quantity
                item.system_quantity = current_sys
                delta = item.physical_quantity - current_sys
                item.delta = delta

                if delta == 0:
                    continue  # No change

                if delta < 0 and (current_sys + delta) < 0:
                    product = db.query(models.Product).filter(models.Product.id == item.product_id).first()
                    pname = product.name if product else f"ID {item.product_id}"
                    raise HTTPException(
                        status_code=400,
                        detail=f"Negative stock not allowed. Product '{pname}' has system qty {current_sys}, physical count {item.physical_quantity}"
                    )

                balance.quantity = item.physical_quantity
                balance.updated_at = datetime.utcnow()

                m_type = "ADJUSTMENT_IN" if delta > 0 else "ADJUSTMENT_OUT"
                qty_in = delta if delta > 0 else 0.0
                qty_out = abs(delta) if delta < 0 else 0.0

                movement = models.StockMovement(
                    reference_no=adj.adjustment_no,
                    movement_type=m_type,
                    product_id=item.product_id,
                    source_location_id=adj.location_id if delta < 0 else None,
                    destination_location_id=adj.location_id if delta > 0 else None,
                    quantity_in=qty_in,
                    quantity_out=qty_out,
                    balance_after=balance.quantity,
                    reason=f"Adjustment ({adj.reason}): {adj.notes or ''}",
                    created_by=user_id,
                    created_at=datetime.utcnow()
                )
                db.add(movement)
                InventoryService.update_alerts_for_product(db, item.product_id, adj.location_id, balance.quantity)

                # Anomaly rule: Large adjustment alert
                if abs(delta) >= 10:
                    alert = models.Alert(
                        product_id=item.product_id,
                        location_id=adj.location_id,
                        alert_type="LARGE_ADJUSTMENT",
                        severity="MEDIUM",
                        message=f"Large stock adjustment of {delta:+.1f} units posted for product ID {item.product_id} (Reason: {adj.reason}).",
                        status="ACTIVE"
                    )
                    db.add(alert)

            adj.status = "POSTED"
            adj.posted_by = user_id
            adj.posted_at = datetime.utcnow()
            db.commit()
            db.refresh(adj)
            return adj
        except Exception as e:
            db.rollback()
            if isinstance(e, HTTPException):
                raise e
            raise HTTPException(status_code=500, detail=f"Failed to post inventory adjustment: {str(e)}")
