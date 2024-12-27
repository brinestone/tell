import passport from 'passport';
import express from 'express';

export const auth = passport.authenticate('jwt', { session: false }) as express.Handler;
