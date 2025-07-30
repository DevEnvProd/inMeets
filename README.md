# PropertyCRM - AI-Powered Real Estate Platform

A modern, AI-powered real estate CRM platform built with React, Supabase, and Stripe.

## 🚀 Features

- **User Authentication** - Secure signup/login with Supabase Auth
- **Organization Management** - Create or join real estate organizations
- **Subscription Plans** - Stripe-powered billing with monthly/yearly options
- **Team Collaboration** - Invite team members and manage roles
- **Property Management** - Comprehensive property portfolio management
- **AI Insights** - Intelligent market analysis and recommendations
- **Responsive Design** - Works perfectly on desktop and mobile

## 💳 Subscription Plans

- **Starter** - $29/month ($290/year) - Perfect for individual agents
- **Professional** - $79/month ($790/year) - Great for small teams  
- **Enterprise** - $199/month ($1990/year) - For large organizations

## 🛠️ Setup Instructions

### 1. Environment Variables

Copy `.env.example` to `.env` and fill in your credentials:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Stripe Configuration  
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### 2. Supabase Setup

1. Create a new Supabase project
2. Run the database migrations in order:
   - `supabase/migrations/setup_stripe_products.sql`
3. Set up Supabase Edge Function secrets:
   - `STRIPE_SECRET_KEY` - Your Stripe secret key
   - `STRIPE_WEBHOOK_SECRET` - Your Stripe webhook secret

### 3. Stripe Setup

1. **Create Products in Stripe Dashboard:**
   - Go to Products → Add Product
   - Create 3 products: Starter, Professional, Enterprise
   - For each product, create both monthly and yearly prices

2. **Update Price IDs:**
   - Replace the placeholder price IDs in the database migration
   - Update `stripe_price_id_monthly` and `stripe_price_id_yearly` for each plan

3. **Set up Webhooks:**
   - Go to Developers → Webhooks → Add endpoint
   - URL: `https://[your-project].supabase.co/functions/v1/stripe-webhook`
   - Events to listen for:
     - `checkout.session.completed`
     - `customer.subscription.deleted`
     - `invoice.payment_failed`
     - `customer.subscription.updated`

### 4. Deploy Edge Functions

Deploy the Supabase Edge Functions:

```bash
supabase functions deploy create-checkout-session
supabase functions deploy verify-payment  
supabase functions deploy stripe-webhook
```

### 5. Install Dependencies & Run

```bash
npm install
npm run dev
```

## 🔄 Payment Flow

1. **User Registration** → Creates account
2. **Organization Setup** → Creates organization (status: pending)
3. **Plan Selection** → Redirects to Stripe Checkout
4. **Payment Success** → Webhook updates organization (status: active)
5. **Dashboard Access** → Full platform access granted

## 🎯 Key Features

### Authentication & Organizations
- Secure user authentication with Supabase
- Multi-tenant organization structure
- Role-based access control (organizer/member)
- Team invitation system with unique codes

### Subscription Management
- Stripe-powered subscription billing
- Monthly and yearly billing cycles
- Automatic subscription status tracking
- Webhook-based real-time updates
- Subscription expiry date calculation

### User Interface
- Modern, responsive design with Tailwind CSS
- Intuitive dashboard with key metrics
- Property management interface
- Team management tools
- Real-time subscription status display

## 🔐 Security

- Row Level Security (RLS) enabled on all tables
- Secure API endpoints with proper authentication
- Stripe webhook signature verification
- Environment variable protection

## 📱 Mobile Ready

The application is fully responsive and works seamlessly on:
- Desktop computers
- Tablets
- Mobile phones

## 🤝 Support

For support and questions:
- Check the documentation
- Review the code comments
- Contact the development team

---

Built with ❤️ using React, Supabase, Stripe, and Tailwind CSS.