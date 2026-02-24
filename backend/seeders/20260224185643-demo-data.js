'use strict';
const bcrypt = require('bcryptjs');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      console.log('🌱 Starting demo data seeding...');

      // =============================================
      // 1. CREATE DEMO USERS - Get IDs with separate query
      // =============================================
      const hashedPassword = await bcrypt.hash('password123', 10);

      // Insert users
      await queryInterface.bulkInsert('Users', [
        {
          name: 'John Doe',
          email: 'john@example.com',
          password: hashedPassword,
          role: 'author',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          name: 'Jane Smith',
          email: 'jane@example.com',
          password: hashedPassword,
          role: 'author',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          name: 'Admin User',
          email: 'admin@example.com',
          password: hashedPassword,
          role: 'admin',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          name: 'Bob Johnson',
          email: 'bob@example.com',
          password: hashedPassword,
          role: 'author',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          name: 'Sarah Wilson',
          email: 'sarah@example.com',
          password: hashedPassword,
          role: 'author',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]);

      console.log('✅ Demo users created');

      // =============================================
      // 2. FETCH USER IDs to use for articles
      // =============================================
      const users = await queryInterface.sequelize.query(
        `SELECT id, name FROM "Users" WHERE email IN ('john@example.com', 'jane@example.com', 'admin@example.com', 'bob@example.com', 'sarah@example.com')`,
        { type: Sequelize.QueryTypes.SELECT }
      );

      // Create a map of user names to IDs
      const userIdMap = {};
      users.forEach(user => {
        userIdMap[user.name] = user.id;
      });

      console.log('📋 User IDs:', userIdMap);

      // =============================================
      // 3. CREATE DEMO ARTICLES with dynamic IDs
      // =============================================
      await queryInterface.bulkInsert('Articles', [
        {
          title: 'Getting Started with React',
          body: '<p>React is a powerful JavaScript library for building user interfaces. In this comprehensive guide, we\'ll cover the fundamentals of React, including components, props, state, and hooks. You\'ll learn how to create your first React app and understand the core concepts that make React so popular.</p><p>We\'ll also explore modern React development practices, including functional components, the useState and useEffect hooks, and how to manage component lifecycle. By the end of this article, you\'ll have a solid foundation to start building your own React applications.</p>',
          tags: 'react,javascript,frontend,tutorial',
          authorId: userIdMap['John Doe'],
          published_status: 1,
          likesCount: 15,
          commentsCount: 5,
          createdAt: new Date('2024-03-15T10:00:00Z'),
          updatedAt: new Date('2024-03-15T10:00:00Z')
        },
        {
          title: 'Understanding JavaScript Closures',
          body: '<p>Closures are one of the most powerful and often misunderstood concepts in JavaScript. A closure is created when a function retains access to its lexical scope even when the function is executed outside that scope.</p><p>In this article, we\'ll explore practical examples of closures, including data privacy, function factories, and event handlers. You\'ll learn how closures work under the hood and how to leverage them in your daily coding.</p>',
          tags: 'javascript,programming,advanced',
          authorId: userIdMap['Jane Smith'],
          published_status: 1,
          likesCount: 23,
          commentsCount: 8,
          createdAt: new Date('2024-03-14T14:30:00Z'),
          updatedAt: new Date('2024-03-14T14:30:00Z')
        },
        {
          title: 'Building REST APIs with Node.js',
          body: '<p>Node.js is perfect for building scalable REST APIs. In this tutorial, we\'ll create a complete RESTful API using Express.js, including proper routing, error handling, and middleware. You\'ll learn about HTTP methods, status codes, and API design best practices.</p><p>We\'ll also cover authentication with JWT, request validation, and database integration with MongoDB. By the end, you\'ll have a production-ready API template you can use for your own projects.</p>',
          tags: 'nodejs,api,backend,express',
          authorId: userIdMap['John Doe'],
          published_status: 1,
          likesCount: 31,
          commentsCount: 12,
          createdAt: new Date('2024-03-13T09:15:00Z'),
          updatedAt: new Date('2024-03-13T09:15:00Z')
        },
        {
          title: 'CSS Grid Mastery',
          body: '<p>CSS Grid is revolutionizing web layout design. This comprehensive guide will take you from beginner to expert in CSS Grid. You\'ll learn about grid containers, grid items, template areas, and responsive design patterns.</p><p>We\'ll build real-world examples including complex layouts, card grids, and magazine-style designs. You\'ll also learn how to combine Grid with Flexbox for maximum layout control.</p>',
          tags: 'css,frontend,design,webdev',
          authorId: userIdMap['Bob Johnson'],
          published_status: 1,
          likesCount: 18,
          commentsCount: 6,
          createdAt: new Date('2024-03-12T16:45:00Z'),
          updatedAt: new Date('2024-03-12T16:45:00Z')
        },
        {
          title: 'Mastering Async/Await in JavaScript',
          body: '<p>Async/await has transformed how we handle asynchronous operations in JavaScript. This deep dive will show you how to write clean, readable asynchronous code without callback hell or complex Promise chains.</p><p>We\'ll cover error handling, parallel execution, race conditions, and practical patterns for real-world applications. You\'ll learn when to use async/await vs Promises and how to debug async code effectively.</p>',
          tags: 'javascript,async,programming',
          authorId: userIdMap['Sarah Wilson'],
          published_status: 0, // Draft
          likesCount: 0,
          commentsCount: 0,
          createdAt: new Date('2024-03-11T11:20:00Z'),
          updatedAt: new Date('2024-03-11T11:20:00Z')
        },
        {
          title: 'Docker for Beginners',
          body: '<p>Docker has become essential for modern development. This beginner-friendly guide will help you understand containers, images, and how to dockerize your applications. You\'ll learn to write Dockerfiles, use docker-compose, and manage containers effectively.</p><p>We\'ll build a complete development environment with Node.js, PostgreSQL, and Redis using Docker. You\'ll see how containers can simplify your development workflow and ensure consistency across environments.</p>',
          tags: 'docker,devops,containers',
          authorId: userIdMap['Jane Smith'],
          published_status: 1,
          likesCount: 12,
          commentsCount: 4,
          createdAt: new Date('2024-03-10T13:10:00Z'),
          updatedAt: new Date('2024-03-10T13:10:00Z')
        }
      ]);

      console.log('✅ Demo articles created');

      // =============================================
      // 4. GET ARTICLE IDs for comments and likes
      // =============================================
      const articles = await queryInterface.sequelize.query(
        `SELECT id, title FROM "Articles"`,
        { type: Sequelize.QueryTypes.SELECT }
      );

      const articleIdMap = {};
      articles.forEach(article => {
        if (article.title.includes('React')) articleIdMap.react = article.id;
        if (article.title.includes('Closures')) articleIdMap.closures = article.id;
        if (article.title.includes('REST APIs')) articleIdMap.node = article.id;
        if (article.title.includes('CSS Grid')) articleIdMap.css = article.id;
        if (article.title.includes('Async/Await')) articleIdMap.async = article.id;
        if (article.title.includes('Docker')) articleIdMap.docker = article.id;
      });

      // =============================================
      // 5. CREATE DEMO COMMENTS
      // =============================================
      await queryInterface.bulkInsert('Comments', [
        {
          articleId: articleIdMap.react,
          name: 'Mike Johnson',
          comment: 'This is exactly what I needed! The explanations are clear and the examples are perfect.',
          sessionId: 'session_' + Date.now() + '_1',
          ipAddress: '192.168.1.101',
          createdAt: new Date('2024-03-16T11:23:00Z'),
          updatedAt: new Date('2024-03-16T11:23:00Z')
        },
        {
          articleId: articleIdMap.react,
          name: 'Emily Davis',
          comment: 'Great article! Could you do a follow-up on React Router?',
          sessionId: 'session_' + Date.now() + '_2',
          ipAddress: '192.168.1.102',
          createdAt: new Date('2024-03-16T14:45:00Z'),
          updatedAt: new Date('2024-03-16T14:45:00Z')
        },
        {
          articleId: articleIdMap.closures,
          name: 'Alex Chen',
          comment: 'Finally someone explained closures in a way that makes sense! The factory function example really clicked for me.',
          sessionId: 'session_' + Date.now() + '_3',
          ipAddress: '192.168.1.103',
          createdAt: new Date('2024-03-15T09:30:00Z'),
          updatedAt: new Date('2024-03-15T09:30:00Z')
        },
        {
          articleId: articleIdMap.closures,
          name: 'Lisa Wong',
          comment: 'This is gold! I\'ve been struggling with closures for months.',
          sessionId: 'session_' + Date.now() + '_4',
          ipAddress: '192.168.1.104',
          createdAt: new Date('2024-03-15T16:20:00Z'),
          updatedAt: new Date('2024-03-15T16:20:00Z')
        },
        {
          articleId: articleIdMap.node,
          name: 'Tom Harris',
          comment: 'The JWT authentication section was exactly what I needed for my project. Thanks!',
          sessionId: 'session_' + Date.now() + '_5',
          ipAddress: '192.168.1.105',
          createdAt: new Date('2024-03-14T10:15:00Z'),
          updatedAt: new Date('2024-03-14T10:15:00Z')
        },
        {
          articleId: articleIdMap.css,
          name: 'Rachel Green',
          comment: 'The Holy Grail layout example is brilliant! I\'ve been trying to achieve this for ages.',
          sessionId: 'session_' + Date.now() + '_6',
          ipAddress: '192.168.1.106',
          createdAt: new Date('2024-03-13T08:45:00Z'),
          updatedAt: new Date('2024-03-13T08:45:00Z')
        },
        {
          articleId: articleIdMap.docker,
          name: 'Chris Evans',
          comment: 'Finally a Docker tutorial that doesn\'t assume I\'m already an expert! The docker-compose section was super helpful.',
          sessionId: 'session_' + Date.now() + '_7',
          ipAddress: '192.168.1.107',
          createdAt: new Date('2024-03-11T19:30:00Z'),
          updatedAt: new Date('2024-03-11T19:30:00Z')
        }
      ]);

      console.log('✅ Demo comments created');

      // =============================================
      // 6. CREATE DEMO LIKES
      // =============================================
      const likeEntries = [];
      const articles_list = [articleIdMap.react, articleIdMap.closures, articleIdMap.node, articleIdMap.css, articleIdMap.docker];
      
      let likeCounter = 1;
      articles_list.forEach(articleId => {
        if (!articleId) return;
        
        // Add 3-5 likes per article
        const likeCount = articleId === articleIdMap.closures ? 5 : 
                         articleId === articleIdMap.node ? 4 : 3;
        
        for (let i = 0; i < likeCount; i++) {
          likeEntries.push({
            articleId: articleId,
            sessionId: `session_like_${likeCounter}`,
            ipAddress: `192.168.1.${200 + likeCounter}`,
            createdAt: new Date(),
            updatedAt: new Date()
          });
          likeCounter++;
        }
      });

      await queryInterface.bulkInsert('Likes', likeEntries);

      console.log('✅ Demo likes created');
      console.log('🎉 All demo data seeded successfully!');

    } catch (error) {
      console.error('❌ Seeding failed:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Delete in reverse order to avoid foreign key constraints
    await queryInterface.bulkDelete('Likes', null, {});
    await queryInterface.bulkDelete('Comments', null, {});
    await queryInterface.bulkDelete('Articles', null, {});
    await queryInterface.bulkDelete('Users', null, {});
    
    console.log('🗑️  All demo data removed');
  }
};