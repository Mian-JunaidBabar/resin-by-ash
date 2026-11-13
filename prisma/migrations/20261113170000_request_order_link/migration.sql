ALTER TABLE "Order" ADD COLUMN "customRequestId" INTEGER;
ALTER TABLE "CustomRequest" ADD CONSTRAINT "CustomRequest_orderId_key" UNIQUE ("orderId");
ALTER TABLE "Order" ADD CONSTRAINT "Order_customRequestId_key" UNIQUE ("customRequestId");
ALTER TABLE "Order" ADD CONSTRAINT "Order_customRequestId_fkey" FOREIGN KEY ("customRequestId") REFERENCES "CustomRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CustomRequest" ADD CONSTRAINT "CustomRequest_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;
