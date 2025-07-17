@@ .. @@
 import DriverVerificationForm from './components/DriverVerificationForm.jsx';
 import AdminUserVerificationPanel from './components/AdminUserVerificationPanel.jsx';
 import DriverLocationControl from './components/DriverLocationControl.jsx';
+import AdminDashboard from './components/AdminDashboard.jsx';
 import { AuthProvider } from './hooks/useAuth.jsx';
 import { useAuth } from './hooks/useAuth.jsx';
 import useUserRole from './hooks/useUserRole.js';
@@ .. @@
   const [showVerificationForm, setShowVerificationForm] = useState(false);
   const [showAdminPanel, setShowAdminPanel] = useState(false);
+  const [showAdminDashboard, setShowAdminDashboard] = useState(false);

   // Check if mobile
@@ .. @@
     );
   }

+  // Show admin dashboard
+  if (isAdmin && showAdminDashboard) {
+    return (
+      <div className="min-h-screen bg-background">
+        <div className="p-4">
+          <div className="mb-4">
+            <Button
+              variant="outline"
+              onClick={() => setShowAdminDashboard(false)}
+            >
+              ← Back to Map
+            </Button>
+          </div>
+          <AdminDashboard />
+        </div>
+      </div>
+    );
+  }
+
   // Show admin panel
@@ .. @@
             {isAdmin && (
               <Button
                 variant="outline"
                 size="sm"
                 className="w-full"
                 onClick={() => setShowAdminPanel(true)}
               >
                 Manage User Verifications
               </Button>
+            )}
+            
+            {isAdmin && (
+              <Button
+                variant="outline"
+                size="sm"
+                className="w-full"
+                onClick={() => setShowAdminDashboard(true)}
+              >
+                Admin Dashboard
+              </Button>
             )}
           </div>