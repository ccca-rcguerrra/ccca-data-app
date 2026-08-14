import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/shadcn/card';

export const BlankPage = () => {
  return (
    <div className="w-full h-screen flex flex-col items-center justify-center p-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">Blank Page</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground">
            Esta é uma página em branco que pode ser usada como template.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
