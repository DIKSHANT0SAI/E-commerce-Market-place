import mongoose from "mongoose";

const orderSchema = new  mongoose.Schema({
    userId:{type:String , required:true,ref:'user'},
    items:[{
        product :{type : String , required:true,ref:'product'},
        quantity :{type : Number , required : true}
    }],
    amount : {type:Number , required : true},
    address : {type:String ,required :true,ref:'address'}, // ref should be the name you write in model not mongodb
    status:{type :String ,required:true,default:'Order Placed', enum:['Order Placed','Shipped','Out for Delivery','Delivered','Cancelled']},
    assignedTo:{type:String, default:null},      // delivery agent's user id (null = unassigned)
    assignedToName:{type:String, default:''},     // agent name, denormalized for display
    paymentMethod:{type:String, enum:['COD','Online'], default:'COD'},
    paymentStatus:{type:String, enum:['Pending','Paid','Failed'], default:'Pending'},
    paymentId:{type:String, default:''},          // razorpay payment id (online)
    razorpayOrderId:{type:String, default:''},    // razorpay order id (used for idempotency)
    idempotencyKey:{type:String, default:''},     // client-supplied key (used for COD idempotency)
    date : {type : Number,required:true}
})


orderSchema.index({ userId: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ date: -1 });
orderSchema.index({ "items.product": 1 });
// Atomic idempotency for online payments — at most one order per Razorpay order id.
// Partial filter excludes COD orders (which store razorpayOrderId: "").
orderSchema.index(
  { razorpayOrderId: 1 },
  { unique: true, partialFilterExpression: { razorpayOrderId: { $gt: "" } } }
);
// Atomic idempotency for COD — at most one order per client-supplied key, so a
// double-click / retry on "Place Order" can't create duplicate orders.
// Partial filter excludes orders without a key (online orders store idempotencyKey: "").
orderSchema.index(
  { idempotencyKey: 1 },
  { unique: true, partialFilterExpression: { idempotencyKey: { $gt: "" } } }
);


const Order = mongoose.models.order || mongoose.model('order',orderSchema);
export default Order;