import { createAdminClient } from '../lib/supabase/admin';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();

async function seed() {
  console.log('Starting Fairway for Good Database Seed...');
  const supabase = createAdminClient();

  // 1. Seed Charities
  const sampleCharities = [
    {
      slug: 'green-grassroots-foundation',
      name: 'Green Grassroots Foundation',
      tagline: 'Preserving natural ecosystems around community courses.',
      description: 'Green Grassroots Foundation dedicates 100% of its resources to restoring biodiversity, planting local trees, and keeping surrounding wetlands clean for public wildlife sanctuaries.',
      category: 'Environment',
      logo_url: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=300',
      image_url: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800',
      featured: true,
      active: true,
    },
    {
      slug: 'youth-golf-and-education-initiative',
      name: 'Youth Golf & Education Initiative',
      tagline: 'Empowering young minds through sportsmanship and mentorship.',
      description: 'Providing equipment, life skills coaching, and academic scholarships to underrepresented youth across rural and urban communities.',
      category: 'Education',
      logo_url: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=300',
      image_url: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800',
      featured: true,
      active: true,
    },
    {
      slug: 'veterans-care-alliance',
      name: 'Veterans Care Alliance',
      tagline: 'Support and rehabilitation for military veterans.',
      description: 'Organizing adaptive outdoor recreational programs and healthcare services for recovering service members.',
      category: 'Healthcare',
      logo_url: 'https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?w=300',
      image_url: 'https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?w=800',
      featured: false,
      active: true,
    },
  ];

  for (const charity of sampleCharities) {
    const { data: existing } = await supabase
      .from('charities')
      .select('id')
      .eq('slug', charity.slug)
      .maybeSingle();

    if (!existing) {
      const { data, error } = await supabase.from('charities').insert(charity).select().single();
      if (error) {
        console.error(`Error inserting charity ${charity.name}:`, error.message);
      } else {
        console.log(`Created charity: ${charity.name} (${data.id})`);

        // Add sample charity event
        await supabase.from('charity_events').insert({
          charity_id: data.id,
          title: `${charity.name} Annual Charity Scramble`,
          description: `Join us for our annual fundraising tournament supporting local community projects!`,
          event_date: new Date(Date.now() + 30 * 86400 * 1000).toISOString(),
          location: 'Pine Valley Golf Club & Resort',
        });
      }
    } else {
      console.log(`Charity ${charity.name} already exists.`);
    }
  }

  // 2. Create Admin User
  const adminEmail = process.env.TEST_ADMIN_EMAIL || 'admin@fairwayforgood.org';
  const adminPassword = process.env.TEST_ADMIN_PASSWORD || 'AdminPassword123!';

  const { data: usersList } = await supabase.auth.admin.listUsers();
  let adminUser = usersList.users.find((u) => u.email === adminEmail);

  if (!adminUser) {
    const { data: newAdmin, error: adminErr } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
      user_metadata: {
        full_name: 'System Admin',
        role: 'admin',
      },
    });

    if (adminErr) {
      console.error('Failed to create admin user:', adminErr.message);
    } else {
      adminUser = newAdmin.user;
      console.log(`Created Admin User: ${adminEmail}`);
    }
  } else {
    console.log(`Admin user ${adminEmail} already exists.`);
  }

  // Ensure user_roles has admin role
  if (adminUser) {
    await supabase.from('user_roles').upsert({
      user_id: adminUser.id,
      role: 'admin',
    });
  }

  // 3. Create Sample Member User
  const memberEmail = process.env.TEST_USER_EMAIL || 'member@fairwayforgood.org';
  const memberPassword = process.env.TEST_USER_PASSWORD || 'MemberPassword123!';

  let memberUser = usersList.users.find((u) => u.email === memberEmail);

  if (!memberUser) {
    const { data: newMember, error: memberErr } = await supabase.auth.admin.createUser({
      email: memberEmail,
      password: memberPassword,
      email_confirm: true,
      user_metadata: {
        full_name: 'John Golfer',
        role: 'member',
      },
    });

    if (memberErr) {
      console.error('Failed to create member user:', memberErr.message);
    } else {
      memberUser = newMember.user;
      console.log(`Created Member User: ${memberEmail}`);
    }
  } else {
    console.log(`Member user ${memberEmail} already exists.`);
  }

  console.log('Database Seed Complete!');
}

seed().catch((err) => {
  console.error('Seed script error:', err);
  process.exit(1);
});
