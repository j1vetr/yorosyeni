---
name: Wouter v3 routing gotchas
description: Known issues with wouter v3 nested routing patterns in this project
---

## Rule
In wouter v3, the `{*splat}` wildcard syntax in a parent `<Route>` is unreliable when combined with nested `<Switch>` components. When `/admin/{*splat}` is the parent route, the inner Switch with `/admin/login` may not match correctly.

## Fix
Flatten all routes into a single top-level `<Switch>`. List specific routes before general ones:
```jsx
<Switch>
  <Route path="/admin/login" component={AdminLogin} />
  <Route path="/admin/categories" component={...} />
  <Route path="/admin/products" component={...} />
  <Route path="/admin/settings" component={...} />
  <Route path="/admin" component={...} />   // must be AFTER specific sub-routes
</Switch>
```

**Why:** wouter uses `regexparam` for path matching. The `{*splat}` group can consume paths before the inner Switch gets to evaluate them, but the inner Switch may then fail to re-match because location context hasn't been updated.
