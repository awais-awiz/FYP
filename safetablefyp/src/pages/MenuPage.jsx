import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, ShoppingCart, Plus, Minus, Trash2, CheckCircle2, CreditCard, ClipboardList, Loader2, AlertTriangle, Box, Sparkles } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import MenuScene from "@/components/MenuScene";
import GLBModelViewer from "@/components/GLBModelViewer";
import dishImage from "@/assets/dish-steak.jpg";
import { useCart } from "@/hooks/useCart";
import { useOrders } from "@/hooks/useOrders";
import { useCustomerSession } from "@/hooks/useCustomerSession";
import { useToast } from "@/hooks/use-toast";
import { menuApi, safepayApi, paymentsApi } from "@/lib/api";
import {
  Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";

const TableBootstrap = () => {
  const { tableNumber, start, loading } = useCustomerSession();
  const { toast } = useToast();
  const [n, setN] = useState(1);
  if (tableNumber) return null;
  const handleStart = async () => {
    const result = await start("en");
    if (!result?.success) {
      toast({
        title: "Unable to start session",
        description: result?.message || "Please try again.",
        variant: "destructive",
      });
    }
  };
  return (
    <div className="container mx-auto px-4 py-6">
      <Card className="glass-morphism p-6 border-2 border-primary/30 max-w-xl mx-auto">
        <div className="flex items-start gap-4">
          <AlertTriangle className="w-6 h-6 text-yellow-500 flex-shrink-0 mt-1" />
          <div className="flex-1">
            <h3 className="font-bold mb-1">Pick a table to start</h3>
            <p className="text-sm text-muted-foreground mb-4">
              You need an active table session to place orders. Pick your table number below.
            </p>
            <div className="flex gap-2 items-center">
              <Button onClick={() => handleStart()} disabled={loading} className="w-full">
                {loading ? "Starting Session…" : "Start Automated Session"}
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

const MenuPage = () => {
  const { items, addItem, removeItem, updateQuantity, clearCart, getTotalPrice, getTotalItems } = useCart();
  const { addOrder } = useOrders();
  const { tableNumber, hasTicket } = useCustomerSession();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState("cart");
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentOrderId, setCurrentOrderId] = useState(null);
  const [paymentQR, setPaymentQR] = useState(null);
  const [preview3dItem, setPreview3dItem] = useState(null);

  useEffect(() => {
    let interval;
    if (checkoutStep === "waiting_payment" && currentOrderId) {
      interval = setInterval(async () => {
        try {
          const res = await paymentsApi.byOrder(currentOrderId);
          if (res && res.status === "completed") {
            setCheckoutStep("success");
            clearCart();
          }
        } catch (err) {
          // Ignore transient errors
        }
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [checkoutStep, currentOrderId, clearCart]);

  const { data: menuData, isLoading, error, refetch } = useQuery({
    queryKey: ["menu"],
    queryFn: () => menuApi.list(),
  });
  const menuItems = menuData?.items || [];

  const handleAddToCart = (item) => {
    addItem({ id: item._id, name: item.name, price: item.price });
    toast({ title: "Added to cart", description: `${item.name} added.` });
  };

  const handleConfirmOrder = () => {
    if (!hasTicket) {
      toast({ title: "Pick a table first", description: "Start a session at the top of the menu page.", variant: "destructive" });
      return;
    }
    setCheckoutStep("confirm");
  };

  const handleProceedToPayment = async () => {
    setCheckoutStep("payment");
    setPaymentQR(null);
  };

  const handleCompletePayment = async () => {
    setIsProcessing(true);
    try {
      const order = await addOrder(items);
      setCurrentOrderId(order.orderId);

      try {
        const intent = await safepayApi.generateQR({
          order_id: order.orderId,
          table_number: tableNumber,
        });
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(intent.checkout_url)}`;
        setPaymentQR(qrUrl);
        setCheckoutStep("waiting_payment");
      } catch (err) {
        console.warn("[Menu] Safepay QR generation failed:", err.message);
        toast({ title: "Payment Init failed", description: err.message, variant: "destructive" });
      }

    } catch (err) {
      toast({ title: "Order failed", description: err.message, variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCloseCheckout = () => {
    setIsCartOpen(false);
    setCheckoutStep("cart");
    setCurrentOrderId(null);
    setPaymentQR(null);
  };

  const handleViewOrders = () => { handleCloseCheckout(); navigate("/orders"); };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 z-50 bg-background/80 backdrop-blur-2xl border-b border-primary/20 shadow-[0_4px_30px_rgba(var(--primary),0.15)]"
      >
        <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
        <div className="container mx-auto px-4 py-4 flex items-center justify-between relative">
          <Link to="/">
            <Button variant="outline" size="sm" className="bg-background/50 hover:bg-primary/10 hover:text-primary border-primary/20 transition-all shadow-sm">
              <ArrowLeft className="w-4 h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Back</span>
            </Button>
          </Link>
          
          <div className="flex items-center gap-2 absolute left-1/2 -translate-x-1/2">
            <Sparkles className="w-5 h-5 text-primary" />
            <h1 className="text-xl md:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent tracking-wide">
              3D AR Menu
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="relative bg-background/50 hover:bg-primary/10 hover:text-primary border-primary/20 transition-all shadow-sm">
                  <ShoppingCart className="w-4 h-4" />
                  <span className="hidden sm:inline ml-2">Cart</span>
                  {getTotalItems() > 0 && (
                    <span className="absolute -top-2 -right-2 w-5 h-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center font-bold shadow-md shadow-primary/30">
                      {getTotalItems()}
                    </span>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent className="glass-morphism border-l-2 border-primary/30 w-full sm:max-w-lg">
                <SheetHeader>
                  <SheetTitle className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">Your Cart</SheetTitle>
                  <SheetDescription>
                    {getTotalItems()} {getTotalItems() === 1 ? "item" : "items"} in your cart
                  </SheetDescription>
                </SheetHeader>
                <div className="mt-8 space-y-4">
                  {items.length === 0 ? (
                    <div className="text-center text-muted-foreground py-16 flex flex-col items-center">
                      <ShoppingCart className="w-16 h-16 mb-4 opacity-20" />
                      <p>Your cart is empty</p>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                        {items.map((item) => (
                          <Card key={item.id} className="bg-background/40 backdrop-blur-md p-4 border border-primary/10 shadow-sm">
                            <div className="flex items-center justify-between gap-4">
                              <div className="flex-1">
                                <h4 className="font-semibold text-foreground">{item.name}</h4>
                                <p className="text-sm text-muted-foreground">Rs. {Math.round(item.price)} each</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button variant="outline" size="icon" className="h-8 w-8 hover:bg-primary/10 hover:text-primary border-primary/20" onClick={() => updateQuantity(item.id, item.quantity - 1)}>
                                  <Minus className="h-3 w-3" />
                                </Button>
                                <span className="w-8 text-center font-bold text-lg">{item.quantity}</span>
                                <Button variant="outline" size="icon" className="h-8 w-8 hover:bg-primary/10 hover:text-primary border-primary/20" onClick={() => updateQuantity(item.id, item.quantity + 1)}>
                                  <Plus className="h-3 w-3" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 ml-2 hover:bg-destructive/10 hover:text-destructive transition-colors" onClick={() => removeItem(item.id)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                            <div className="mt-2 text-right font-black text-primary">
                              Rs. {Math.round(item.price * item.quantity)}
                            </div>
                          </Card>
                        ))}
                      </div>
                      <div className="border-t border-border/50 pt-4 space-y-4">
                        <div className="flex justify-between items-center text-lg font-bold">
                          <span>Total:</span>
                          <span className="text-2xl text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">Rs. {Math.round(getTotalPrice())}</span>
                        </div>
                        <Button variant="hero" size="lg" className="w-full text-lg shadow-lg shadow-primary/20" onClick={handleConfirmOrder}>
                          Confirm Order
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </SheetContent>
            </Sheet>
            <Link to="/orders">
              <Button variant="outline" size="sm" className="bg-background/50 hover:bg-primary/10 hover:text-primary border-primary/20 transition-all shadow-sm">
                <ClipboardList className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Orders</span>
              </Button>
            </Link>
          </div>
        </div>
      </motion.header>

      <TableBootstrap />

      {/* Confirmation Dialog */}
      <Dialog open={checkoutStep === "confirm"} onOpenChange={(open) => !open && setCheckoutStep("cart")}>
        <DialogContent className="glass-morphism border-2 border-primary/30">
          <DialogHeader>
            <DialogTitle className="text-2xl text-gradient-primary flex items-center gap-2">
              <CheckCircle2 className="w-6 h-6" />
              Confirm Your Order
            </DialogTitle>
            <DialogDescription>Please review your order before paying</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 my-4">
            {items.map((item) => (
              <div key={item.id} className="flex justify-between items-center">
                <span>{item.quantity}x {item.name}</span>
                <span className="font-semibold">Rs. {Math.round(item.price * item.quantity)}</span>
              </div>
            ))}
            <div className="border-t border-border pt-4 flex justify-between items-center text-lg font-bold">
              <span>Total:</span>
              <span className="text-gradient-primary">Rs. {Math.round(getTotalPrice())}</span>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setCheckoutStep("cart")}>Back to Cart</Button>
            <Button variant="hero" className="flex-1" onClick={handleProceedToPayment}>
              <CreditCard className="w-4 h-4 mr-2" />
              Proceed to Payment
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={checkoutStep === "payment"} onOpenChange={(open) => !open && setCheckoutStep("confirm")}>
        <DialogContent className="glass-morphism border-2 border-primary/30">
          <DialogHeader>
            <DialogTitle className="text-2xl text-gradient-primary flex items-center gap-2">
              <CreditCard className="w-6 h-6" />
              Complete Payment
            </DialogTitle>
            <DialogDescription>Tap to place the order. We'll generate a payment QR.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center my-6">
            <p className="text-2xl font-bold text-gradient-primary mb-4">Rs. {Math.round(getTotalPrice())}</p>
            <p className="text-sm text-muted-foreground">Table #{tableNumber || "—"}</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setCheckoutStep("confirm")}>Back</Button>
            <Button variant="hero" className="flex-1" onClick={handleCompletePayment} disabled={isProcessing}>
              {isProcessing ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Processing…</>
              ) : (
                "Place Order"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Success Dialog */}
      <Dialog open={checkoutStep === "success"} onOpenChange={(open) => !open && handleCloseCheckout()}>
        <DialogContent className="glass-morphism border-2 border-green-500/30 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="mx-auto mb-4"
          >
            <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-12 h-12 text-green-400" />
            </div>
          </motion.div>
          <DialogHeader>
            <DialogTitle className="text-2xl text-center text-gradient-primary">Order Placed Successfully!</DialogTitle>
            <DialogDescription className="text-center">Your order has been confirmed and is being prepared</DialogDescription>
          </DialogHeader>
          <div className="my-6 p-4 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">Your Order Number</p>
            <p className="text-2xl font-bold text-gradient-primary">{currentOrderId}</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={handleCloseCheckout}>Continue Browsing</Button>
            <Button variant="hero" className="flex-1" onClick={handleViewOrders}>
              <ClipboardList className="w-4 h-4 mr-2" />
              View My Orders
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Waiting for Payment Dialog */}
      <Dialog open={checkoutStep === "waiting_payment"} onOpenChange={(open) => !open && handleCloseCheckout()}>
        <DialogContent className="glass-morphism border-2 border-primary/30 text-center">
          <DialogHeader>
            <DialogTitle className="text-2xl text-center text-gradient-primary flex items-center justify-center gap-2">
              <Loader2 className="w-6 h-6 animate-spin" /> Awaiting Payment
            </DialogTitle>
            <DialogDescription className="text-center">Please scan the QR code to pay for your order. Your order will be sent to the kitchen instantly after payment.</DialogDescription>
          </DialogHeader>
          <div className="my-6 p-4 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">Your Order Number</p>
            <p className="text-2xl font-bold text-gradient-primary">{currentOrderId}</p>
            {paymentQR && (
              <img
                src={paymentQR.startsWith('http') ? paymentQR : `data:image/png;base64,${paymentQR}`}
                alt="Payment QR"
                className="mx-auto mt-4 rounded-lg w-48 h-48 bg-white p-2"
              />
            )}
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={handleCloseCheckout}>Cancel / Close</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* 3D Viewer Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-12"
        >
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-2">
              Interactive <span className="text-gradient-primary">3D Preview</span>
            </h2>
            <p className="text-muted-foreground">Explore our dishes in stunning 3D detail before ordering</p>
          </div>
          <MenuScene />
        </motion.section>

        {/* Menu Items Grid */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h2 className="text-2xl font-bold mb-6">Menu Selection</h2>

          {isLoading && (
            <div className="flex items-center justify-center py-20 text-muted-foreground">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />Loading menu…
            </div>
          )}

          {error && !isLoading && (
            <Card className="p-6 text-center border-destructive/50">
              <p className="text-destructive font-semibold mb-2">Couldn't load the menu</p>
              <p className="text-sm text-muted-foreground mb-4">{error.message}</p>
              <Button onClick={() => refetch()} variant="outline">Retry</Button>
            </Card>
          )}

          {!isLoading && !error && menuItems.length === 0 && (
            <Card className="p-12 text-center text-muted-foreground">No menu items available right now.</Card>
          )}

          {!isLoading && !error && menuItems.length > 0 && (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {menuItems.map((item, idx) => (
                <motion.div
                  key={item._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + idx * 0.05 }}
                  whileHover={{ y: -5 }}
                >
                  <Card className="glass-morphism border-2 border-border hover:border-primary/50 transition-all overflow-hidden group h-full flex flex-col">
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={item.image_url || dishImage}
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-card/90 to-transparent" />
                      <div className="absolute top-2 right-2 px-3 py-1 bg-primary/90 text-primary-foreground text-xs font-semibold rounded-full">
                        {item.category}
                      </div>
                    </div>
                    <div className="p-6 flex-1 flex flex-col">
                      <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">{item.name}</h3>
                      <p className="text-muted-foreground text-sm mb-4 flex-1">{item.description}</p>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-2xl font-bold text-gradient-primary">Rs. {Math.round(Number(item.price))}</span>
                        <div className="flex items-center gap-2">
                          {item.model_3d_url && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-primary/40 hover:border-primary hover:bg-primary/10 transition-all"
                              onClick={() => setPreview3dItem(item)}
                            >
                              <Box className="w-4 h-4 mr-1" />
                              3D
                            </Button>
                          )}
                          <Button
                            variant="glow"
                            size="sm"
                            disabled={!item.is_available}
                            onClick={() => handleAddToCart(item)}
                          >
                            <Plus className="w-4 h-4" />
                            {item.is_available ? "Add to Cart" : "Out"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </motion.section>
      </main>

      {/* ─── 3D Preview Dialog ──────────────────────────────────── */}
      <Dialog
        open={!!preview3dItem}
        onOpenChange={(open) => !open && setPreview3dItem(null)}
      >
        <DialogContent className="glass-morphism border-2 border-primary/30 max-w-2xl w-[95vw]">
          <DialogHeader>
            <DialogTitle className="text-2xl text-gradient-primary flex items-center gap-2">
              <Box className="w-6 h-6" />
              {preview3dItem?.name} — 3D View
            </DialogTitle>
            <DialogDescription>
              Interact with the 3D model. Drag to rotate, scroll to zoom.
            </DialogDescription>
          </DialogHeader>
          {preview3dItem?.model_3d_url && (
            <GLBModelViewer
              modelUrl={preview3dItem.model_3d_url}
              height="420px"
              autoRotate
              showControls
            />
          )}
          <div className="flex gap-3 mt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setPreview3dItem(null)}
            >
              Close
            </Button>
            <Button
              variant="glow"
              className="flex-1"
              disabled={!preview3dItem?.is_available}
              onClick={() => {
                if (preview3dItem) handleAddToCart(preview3dItem);
                setPreview3dItem(null);
              }}
            >
              <Plus className="w-4 h-4 mr-1" />
              Add to Cart
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MenuPage;
